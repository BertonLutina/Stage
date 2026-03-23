import React, { useState } from 'react';
import { View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import STText from '../../../components/common/STText';
import BackButton from '../../../components/common/BackButton';
import api from '../../../utils/api';

const BASE_URL = api.defaults.baseURL;

export default function ConnectionTestScreen() {
  const router = useRouter();
  const [result, setResult] = useState(null);
  const [testing, setTesting] = useState(false);

  const testConnection = async () => {
    setTesting(true);
    setResult(null);
    const start = Date.now();
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (BASE_URL.includes('ngrok')) headers['ngrok-skip-browser-warning'] = 'true';
      await api.get('/health', { headers });
      const latency = Date.now() - start;
      setResult({
        success: true,
        latency,
        message: `Connected in ${latency}ms`,
      });
    } catch (err) {
      const latency = Date.now() - start;
      let msg = err.message || err.code || 'Connection failed';
      if (err.code === 'ERR_NETWORK' || err.message?.includes('Network Error')) {
        msg = 'Network error — is backend running? ngrok active? Restart Expo with: npx expo start -c';
      } else if (err.response?.status) {
        msg = `HTTP ${err.response.status}: ${err.response.data?.message || msg}`;
      }
      setResult({
        success: false,
        latency,
        message: msg,
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1" edges={['top']}>
      <View className="flex-row items-center justify-between px-4 pt-2 pb-4">
        <BackButton variant="light" />
        <STText style={{ fontWeight: '800', fontSize: 16 }}>Connection Test</STText>
        <View style={{ width: 40 }} />
      </View>

      <View className="px-5 flex-1">
        <STText style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, marginBottom: 16 }}>
          Test if someone ~30km away can reach your backend. Share the app (Expo + ngrok URL) with them, then have them run this test.
        </STText>

        <View style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: 14, marginBottom: 24 }}>
          <STText style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, marginBottom: 4 }}>API URL</STText>
          <STText style={{ color: '#5FE3E8', fontSize: 13 }} numberOfLines={2}>{BASE_URL}</STText>
        </View>

        <TouchableOpacity
          onPress={testConnection}
          disabled={testing}
          style={{
            backgroundColor: '#5FE3E8',
            paddingVertical: 14,
            borderRadius: 12,
            alignItems: 'center',
          }}
        >
          {testing ? (
            <ActivityIndicator color="#02091B" />
          ) : (
            <STText style={{ color: '#02091B', fontWeight: '700', fontSize: 16 }}>Test Connection</STText>
          )}
        </TouchableOpacity>

        {result && (
          <View
            style={{
              marginTop: 24,
              padding: 16,
              borderRadius: 12,
              borderWidth: 1,
              backgroundColor: result.success ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
              borderColor: result.success ? '#22C55E' : '#EF4444',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <STText style={{ color: result.success ? '#22C55E' : '#EF4444', fontWeight: '800', fontSize: 18 }}>
                {result.success ? 'Success' : 'Failed'}
              </STText>
              <STText style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, marginLeft: 8 }}>
                {result.latency}ms
              </STText>
            </View>
            <STText style={{ color: 'rgba(255,255,255,0.9)', fontSize: 14 }}>{result.message}</STText>
            {!result.success && (
              <STText style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 12 }}>
                Ensure: 1) Backend running (npm run dev) 2) ngrok http 3000 3) npx expo start -c
              </STText>
            )}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
