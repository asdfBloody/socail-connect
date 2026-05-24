import React, {useEffect, useState, useRef, useCallback} from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import {useAuth} from '../context/AuthContext';
import {
  ChatMessage,
  sendMessage,
  subscribeToMessages,
} from '../services/ChatService';

function ChatScreen({route, navigation}: any): React.JSX.Element {
  const {chatId, otherUserId, otherUserName} = route.params;
  const {user} = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList<ChatMessage>>(null);

  useEffect(() => {
    navigation.setOptions({title: otherUserName || 'Chat'});
  }, [navigation, otherUserName]);

  useEffect(() => {
    const unsub = subscribeToMessages(chatId, setMessages);
    return unsub;
  }, [chatId]);

  useEffect(() => {
    if (messages.length === 0) return;
    setTimeout(() => listRef.current?.scrollToEnd({animated: true}), 50);
  }, [messages.length]);

  const handleSend = useCallback(async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      await sendMessage(chatId, otherUserId, text);
      setText('');
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setSending(false);
    }
  }, [text, sending, chatId, otherUserId]);

  const renderItem = useCallback(
    ({item}: {item: ChatMessage}) => {
      const mine = item.senderId === user?.uid;
      return (
        <View
          style={[
            styles.bubbleRow,
            mine ? styles.bubbleRowMine : styles.bubbleRowTheirs,
          ]}>
          <View
            style={[
              styles.bubble,
              mine ? styles.bubbleMine : styles.bubbleTheirs,
            ]}>
            <Text style={mine ? styles.bubbleTextMine : styles.bubbleTextTheirs}>
              {item.text}
            </Text>
          </View>
        </View>
      );
    },
    [user],
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={m => m.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        removeClippedSubviews
        maxToRenderPerBatch={20}
        windowSize={12}
        initialNumToRender={20}
        ListEmptyComponent={
          <Text style={styles.empty}>Say hi 👋</Text>
        }
      />

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="Type a message…"
          multiline
        />
        <TouchableOpacity
          style={[styles.sendBtn, !text.trim() && styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={!text.trim() || sending}>
          <Text style={styles.sendBtnText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#f5f5f5'},
  list: {padding: 12, flexGrow: 1},
  empty: {textAlign: 'center', color: '#999', marginTop: 60},
  bubbleRow: {flexDirection: 'row', marginVertical: 4},
  bubbleRowMine: {justifyContent: 'flex-end'},
  bubbleRowTheirs: {justifyContent: 'flex-start'},
  bubble: {
    maxWidth: '78%',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
  },
  bubbleMine: {backgroundColor: '#6C63FF', borderBottomRightRadius: 4},
  bubbleTheirs: {backgroundColor: '#fff', borderBottomLeftRadius: 4},
  bubbleTextMine: {color: '#fff', fontSize: 15},
  bubbleTextTheirs: {color: '#333', fontSize: 15},
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 8,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    gap: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#f9f9f9',
    maxHeight: 100,
    fontSize: 15,
  },
  sendBtn: {
    backgroundColor: '#6C63FF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  sendBtnDisabled: {backgroundColor: '#bbb'},
  sendBtnText: {color: '#fff', fontWeight: 'bold'},
});

export default ChatScreen;
