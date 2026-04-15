import React, {
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Animated,
  ViewStyle,
  TextStyle,
  PermissionsAndroid,
} from 'react-native'
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet'
import * as Speech from 'expo-speech'
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../theme'
import { AIMessage } from '../../types/ai'
import { useAIEngine } from '../../modules/ai-engine/AIContext'

// Voice recognition — graceful fallback if native module not available
let Voice: {
  start: (lang: string) => Promise<void>
  stop: () => Promise<void>
  cancel: () => Promise<void>
  destroy: () => Promise<void>
  onSpeechStart?: (() => void) | null
  onSpeechEnd?: (() => void) | null
  onSpeechResults?: ((e: { value?: string[] }) => void) | null
  onSpeechError?: ((e: { error?: { message?: string } }) => void) | null
} | null = null

try {
  Voice = require('@react-native-voice/voice').default
} catch {
  console.log('[AIAssistant] @react-native-voice/voice no disponible — modo solo texto')
}

interface AIAssistantProps {
  onClose?: () => void
}

const SUGGESTIONS = [
  '¿Qué puedo cocinar esta noche?',
  '¿Esta receta es apta para Ginny?',
  '¿Qué hay en mi despensa?',
  'Crea un menú saludable para esta semana',
]

export const AIAssistant = forwardRef<BottomSheet, AIAssistantProps>(
  function AIAssistant({ onClose }, ref) {
    const { messages, isResponding, sendMessage, clearHistory } = useAIEngine()
    const [input, setInput] = useState('')
    const [isSpeakerOn, setIsSpeakerOn] = useState(false)
    const [isListening, setIsListening] = useState(false)
    const [voiceError, setVoiceError] = useState<string | null>(null)
    const listRef = useRef<FlatList>(null)
    const pulseAnim = useRef(new Animated.Value(1)).current
    const micAnim = useRef(new Animated.Value(1)).current

    // Pulse animation for typing indicator
    useEffect(() => {
      if (isResponding) {
        Animated.loop(
          Animated.sequence([
            Animated.timing(pulseAnim, { toValue: 0.3, duration: 600, useNativeDriver: true }),
            Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
          ])
        ).start()
      } else {
        pulseAnim.stopAnimation()
        pulseAnim.setValue(1)
      }
    }, [isResponding, pulseAnim])

    // Mic pulse animation
    useEffect(() => {
      if (isListening) {
        Animated.loop(
          Animated.sequence([
            Animated.timing(micAnim, { toValue: 1.3, duration: 500, useNativeDriver: true }),
            Animated.timing(micAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
          ])
        ).start()
      } else {
        micAnim.stopAnimation()
        micAnim.setValue(1)
      }
    }, [isListening, micAnim])

    // Auto-scroll to bottom on new messages
    useEffect(() => {
      if (messages.length > 0) {
        setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100)
      }
    }, [messages])

    // TTS for assistant responses (Spanish)
    useEffect(() => {
      if (!isSpeakerOn) return
      const lastMsg = messages[messages.length - 1]
      if (lastMsg?.role === 'assistant' && !lastMsg.isStreaming && lastMsg.content) {
        Speech.speak(lastMsg.content, {
          language: 'es-ES',
          rate: 1.0,
          pitch: 1.0,
        })
      }
    }, [messages, isSpeakerOn])

    // Setup voice recognition listeners
    useEffect(() => {
      if (!Voice) return

      Voice.onSpeechStart = () => setIsListening(true)
      Voice.onSpeechEnd = () => setIsListening(false)
      Voice.onSpeechResults = (e) => {
        const text = e.value?.[0]
        if (text) {
          setInput(text)
          setIsListening(false)
        }
      }
      Voice.onSpeechError = (e) => {
        setVoiceError(e.error?.message ?? 'Error de voz')
        setIsListening(false)
        setTimeout(() => setVoiceError(null), 3000)
      }

      return () => {
        if (Voice) {
          Voice.onSpeechStart = null
          Voice.onSpeechEnd = null
          Voice.onSpeechResults = null
          Voice.onSpeechError = null
          Voice.destroy().catch(() => {})
        }
      }
    }, [])

    const requestMicPermission = async (): Promise<boolean> => {
      if (Platform.OS === 'android') {
        try {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
            {
              title: 'Permiso de micrófono',
              message: 'NutrIAssistant necesita acceso al micrófono para reconocimiento de voz.',
              buttonPositive: 'Permitir',
              buttonNegative: 'Cancelar',
            }
          )
          return granted === PermissionsAndroid.RESULTS.GRANTED
        } catch {
          return false
        }
      }
      return true // iOS handles permissions automatically
    }

    const handleVoiceInput = useCallback(async () => {
      if (!Voice) return

      if (isListening) {
        await Voice.stop()
        setIsListening(false)
        return
      }

      const hasPermission = await requestMicPermission()
      if (!hasPermission) {
        setVoiceError('Se necesita permiso de micrófono')
        setTimeout(() => setVoiceError(null), 3000)
        return
      }

      try {
        await Voice.start('es-ES')
        setIsListening(true)
        setVoiceError(null)
      } catch (e) {
        setVoiceError('Error al iniciar reconocimiento de voz')
        setTimeout(() => setVoiceError(null), 3000)
      }
    }, [isListening])

    const handleSend = useCallback(async () => {
      const text = input.trim()
      if (!text || isResponding) return
      if (isListening && Voice) {
        await Voice.cancel()
        setIsListening(false)
      }
      setInput('')
      await sendMessage(text)
    }, [input, isResponding, sendMessage, isListening])

    const handleSpeakerToggle = useCallback(() => {
      const next = !isSpeakerOn
      setIsSpeakerOn(next)
      if (!next) Speech.stop()
    }, [isSpeakerOn])

    const renderMessage = ({ item }: { item: AIMessage }) => {
      const isUser = item.role === 'user'
      return (
        <View style={[viewStyles.messageRow, isUser && viewStyles.messageRowUser]}>
          {!isUser && (
            <View style={viewStyles.botAvatar}>
              <Text style={textStyles.botAvatarText}>🤖</Text>
            </View>
          )}
          <View style={[viewStyles.bubble, isUser ? viewStyles.bubbleUser : viewStyles.bubbleBot]}>
            {!isUser && (
              <Text style={textStyles.botName}>NutriBot</Text>
            )}
            <Text style={[textStyles.messageText, isUser && textStyles.messageTextUser]}>
              {item.content}
            </Text>
            {item.isStreaming && (
              <Animated.Text style={[textStyles.cursor, { opacity: pulseAnim }]}>▋</Animated.Text>
            )}
          </View>
        </View>
      )
    }

    const snapPoints = ['50%', '85%']

    return (
      <BottomSheet
        ref={ref}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        onClose={onClose}
        backgroundStyle={viewStyles.sheetBackground}
        handleIndicatorStyle={viewStyles.handle}
      >
        <BottomSheetView style={viewStyles.container}>
          {/* Header */}
          <View style={viewStyles.header}>
            <View style={viewStyles.headerLeft}>
              <Text style={textStyles.title}>🤖 NutriBot</Text>
              <View style={viewStyles.statusDot} />
            </View>
            <View style={viewStyles.headerRight}>
              <TouchableOpacity
                style={[viewStyles.headerBtn, isSpeakerOn && viewStyles.headerBtnActive]}
                onPress={handleSpeakerToggle}
              >
                <Text>{isSpeakerOn ? '🔊' : '🔇'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={viewStyles.headerBtn} onPress={clearHistory}>
                <Text style={textStyles.clearText}>Limpiar</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Voice error */}
          {voiceError && (
            <View style={viewStyles.errorBanner}>
              <Text style={textStyles.errorText}>{voiceError}</Text>
            </View>
          )}

          {/* Messages */}
          {messages.length === 0 ? (
            <View style={viewStyles.welcome}>
              <Text style={textStyles.welcomeEmoji}>👋</Text>
              <Text style={textStyles.welcomeTitle}>¡Hola, soy NutriBot!</Text>
              <Text style={textStyles.welcomeText}>
                Tu asistente de nutrición familiar con IA. Pregúntame sobre recetas, ingredientes, planes de comidas o alérgenos.
              </Text>
              <View style={viewStyles.suggestions}>
                {SUGGESTIONS.map((s) => (
                  <TouchableOpacity
                    key={s}
                    style={viewStyles.suggestion}
                    onPress={() => sendMessage(s)}
                  >
                    <Text style={textStyles.suggestionText}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : (
            <FlatList
              ref={listRef}
              data={messages}
              keyExtractor={(item) => item.id}
              renderItem={renderMessage}
              contentContainerStyle={viewStyles.messageList}
              showsVerticalScrollIndicator={false}
            />
          )}

          {/* Input */}
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <View style={viewStyles.inputContainer}>
              {/* Voice button */}
              {Voice && (
                <Animated.View style={{ transform: [{ scale: micAnim }] }}>
                  <TouchableOpacity
                    style={[viewStyles.micBtn, isListening && viewStyles.micBtnActive]}
                    onPress={handleVoiceInput}
                    disabled={isResponding}
                  >
                    <Text style={textStyles.micIcon}>{isListening ? '⏹' : '🎙️'}</Text>
                  </TouchableOpacity>
                </Animated.View>
              )}
              <TextInput
                style={textStyles.input}
                value={input}
                onChangeText={setInput}
                placeholder={isListening ? 'Escuchando...' : 'Pregunta a NutriBot...'}
                placeholderTextColor={Colors.light.textMuted}
                multiline
                maxLength={500}
                returnKeyType="send"
                onSubmitEditing={handleSend}
              />
              <TouchableOpacity
                style={[viewStyles.sendBtn, (!input.trim() || isResponding) && viewStyles.sendBtnDisabled]}
                onPress={handleSend}
                disabled={!input.trim() || isResponding}
              >
                <Text style={textStyles.sendIcon}>↑</Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </BottomSheetView>
      </BottomSheet>
    )
  }
)

const viewStyles = StyleSheet.create({
  sheetBackground: { backgroundColor: Colors.cream, borderRadius: 24 } as ViewStyle,
  handle: { backgroundColor: Colors.light.border, width: 40 } as ViewStyle,
  container: { flex: 1, paddingBottom: Platform.OS === 'ios' ? 34 : 16 } as ViewStyle,
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderBottomWidth: 1, borderBottomColor: Colors.light.border,
  } as ViewStyle,
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm } as ViewStyle,
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.healthGreen } as ViewStyle,
  headerRight: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' } as ViewStyle,
  headerBtn: { padding: Spacing.xs, borderRadius: BorderRadius.sm } as ViewStyle,
  headerBtnActive: { backgroundColor: `${Colors.healthGreen}20` } as ViewStyle,
  errorBanner: {
    backgroundColor: `${Colors.errorRed}15`, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs,
    borderBottomWidth: 1, borderBottomColor: `${Colors.errorRed}30`,
  } as ViewStyle,
  welcome: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xl, gap: Spacing.md } as ViewStyle,
  suggestions: { gap: Spacing.sm, width: '100%', marginTop: Spacing.md } as ViewStyle,
  suggestion: { backgroundColor: Colors.softMint, padding: Spacing.sm, borderRadius: BorderRadius.md } as ViewStyle,
  messageList: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, gap: Spacing.sm } as ViewStyle,
  messageRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm, alignItems: 'flex-end' } as ViewStyle,
  messageRowUser: { flexDirection: 'row-reverse' } as ViewStyle,
  botAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.softMint, alignItems: 'center', justifyContent: 'center' } as ViewStyle,
  bubble: { maxWidth: '75%', padding: Spacing.sm, borderRadius: BorderRadius.lg, gap: 4 } as ViewStyle,
  bubbleUser: { backgroundColor: Colors.healthGreen, borderBottomRightRadius: 4 } as ViewStyle,
  bubbleBot: { backgroundColor: Colors.softMint, borderBottomLeftRadius: 4, ...Shadows.subtle } as ViewStyle,
  inputContainer: {
    flexDirection: 'row', alignItems: 'flex-end',
    paddingHorizontal: Spacing.md, paddingTop: Spacing.sm, gap: Spacing.sm,
    borderTopWidth: 1, borderTopColor: Colors.light.border,
  } as ViewStyle,
  micBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: `${Colors.goldenAmber}20`,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.goldenAmber,
  } as ViewStyle,
  micBtnActive: {
    backgroundColor: `${Colors.errorRed}20`,
    borderColor: Colors.errorRed,
  } as ViewStyle,
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.healthGreen, alignItems: 'center', justifyContent: 'center' } as ViewStyle,
  sendBtnDisabled: { backgroundColor: Colors.light.border } as ViewStyle,
})

const textStyles = StyleSheet.create({
  title: { ...Typography.heading2, color: Colors.warmCharcoal } as TextStyle,
  clearText: { ...Typography.body, color: Colors.light.textSecondary } as TextStyle,
  welcomeEmoji: { fontSize: 48 } as TextStyle,
  welcomeTitle: { ...Typography.heading1, color: Colors.warmCharcoal, textAlign: 'center' } as TextStyle,
  welcomeText: { ...Typography.body, color: Colors.light.textSecondary, textAlign: 'center' } as TextStyle,
  suggestionText: { ...Typography.body, color: Colors.healthGreen } as TextStyle,
  botAvatarText: { fontSize: 18 } as TextStyle,
  botName: { ...Typography.overline, color: Colors.forestGreen } as TextStyle,
  messageText: { ...Typography.body, color: Colors.warmCharcoal } as TextStyle,
  messageTextUser: { color: Colors.white } as TextStyle,
  cursor: { color: Colors.healthGreen, fontSize: 16 } as TextStyle,
  errorText: { ...Typography.caption, color: Colors.errorRed } as TextStyle,
  micIcon: { fontSize: 18 } as TextStyle,
  input: {
    ...Typography.body, color: Colors.warmCharcoal,
    flex: 1, backgroundColor: Colors.white, borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    maxHeight: 100, ...Shadows.subtle,
  } as TextStyle,
  sendIcon: { color: Colors.white, fontSize: 18, fontWeight: 'bold' } as TextStyle,
})
