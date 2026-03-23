import React, { useState } from 'react';
import {
  View,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Switch,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import STText from '../common/STText';
import BackButton from '../common/BackButton';

const MIN_OPTIONS = 2;
const MAX_OPTIONS = 10;

export default function CreatePollModal({ visible, onClose, onSend, teamId, user }) {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [multiple, setMultiple] = useState(false);
  const [sending, setSending] = useState(false);

  const addOption = () => {
    if (options.length < MAX_OPTIONS) setOptions((o) => [...o, '']);
  };

  const removeOption = (index) => {
    if (options.length > MIN_OPTIONS) setOptions((o) => o.filter((_, i) => i !== index));
  };

  const updateOption = (index, text) => {
    setOptions((o) => o.map((opt, i) => (i === index ? text : opt)));
  };

  const canSend = question.trim().length >= 2 && options.filter((o) => o.trim()).length >= MIN_OPTIONS;

  const handleSend = () => {
    if (!canSend || !user || !teamId) return;
    const validOptions = options.filter((o) => o.trim());
    if (validOptions.length < MIN_OPTIONS) return;

    setSending(true);
    const pollData = {
      options: validOptions.map((text, i) => ({
        id: `opt_${i}`,
        text: text.trim(),
        votes: 0,
        voters: [],
      })),
      multiple,
    };
    onSend({
      teamId,
      user_id: user.id,
      gamer_tag: user.gamer_tag || user.email?.split('@')[0] || 'Anonymous',
      content: question.trim(),
      message_type: 'poll',
      media_url: null,
      media_metadata: pollData,
    });
    setQuestion('');
    setOptions(['', '']);
    setMultiple(false);
    setSending(false);
    onClose();
  };

  const handleClose = () => {
    setQuestion('');
    setOptions(['', '']);
    setMultiple(false);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <BackButton onPress={handleClose} variant="light" />
            <STText style={styles.title}>Create poll</STText>
            <View style={styles.headerSpacer} />
          </View>

          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <View style={styles.section}>
              <STText style={styles.label}>Question</STText>
              <TextInput
                value={question}
                onChangeText={setQuestion}
                placeholder="Ask a question"
                placeholderTextColor="rgba(255,255,255,0.4)"
                style={styles.questionInput}
              />
            </View>

            <View style={styles.section}>
              <STText style={styles.label}>Options</STText>
              {options.map((opt, i) => (
                <View key={i} style={styles.optionRow}>
                  <TextInput
                    value={opt}
                    onChangeText={(t) => updateOption(i, t)}
                    placeholder={`Option ${i + 1}`}
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    style={styles.optionInput}
                  />
                  <TouchableOpacity
                    onPress={() => removeOption(i)}
                    style={styles.removeBtn}
                    disabled={options.length <= MIN_OPTIONS}
                  >
                    <Ionicons name="close-circle" size={24} color={options.length <= MIN_OPTIONS ? 'rgba(255,255,255,0.2)' : '#EF4444'} />
                  </TouchableOpacity>
                </View>
              ))}
              {options.length < MAX_OPTIONS && (
                <TouchableOpacity onPress={addOption} style={styles.addBtn}>
                  <Ionicons name="add-circle-outline" size={22} color="#5FE3E8" />
                  <STText style={styles.addText}>Add option</STText>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.toggleRow}>
              <STText style={styles.toggleLabel}>Allow multiple answers</STText>
              <Switch
                value={multiple}
                onValueChange={setMultiple}
                trackColor={{ false: 'rgba(255,255,255,0.2)', true: 'rgba(95,227,232,0.5)' }}
                thumbColor={multiple ? '#5FE3E8' : 'rgba(255,255,255,0.6)'}
              />
            </View>
          </ScrollView>

          <TouchableOpacity
            onPress={handleSend}
            disabled={!canSend || sending}
            style={[styles.sendBtn, !canSend && styles.sendBtnDisabled]}
          >
            <Ionicons name="send" size={22} color="#02091B" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#07163A',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    flex: 1,
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  headerSpacer: { width: 40 },
  scroll: { maxHeight: 400 },
  section: { marginBottom: 20 },
  label: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    marginBottom: 8,
  },
  questionInput: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#fff',
    fontSize: 16,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  optionInput: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#fff',
    fontSize: 15,
  },
  removeBtn: { padding: 8, marginLeft: 4 },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  addText: { color: '#5FE3E8', fontSize: 15, marginLeft: 8 },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  toggleLabel: { color: 'rgba(255,255,255,0.9)', fontSize: 15 },
  sendBtn: {
    alignSelf: 'flex-end',
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#5FE3E8',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  sendBtnDisabled: { opacity: 0.4 },
});
