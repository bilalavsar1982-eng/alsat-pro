import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, Text, View, SafeAreaView, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import CONFIG from './config';

export default function App() {
  const [gram, setGram] = useState('--');
  const [ons, setOns] = useState('--');
  const [usd, setUsd] = useState('--');
  const [gumus, setGumus] = useState('--');
  const [manualMsg, setManualMsg] = useState('');
  const [log, setLog] = useState([]);
  const [botReplies, setBotReplies] = useState([]);
  const wsRef = useRef(null);

  function pushLog(text) {
    setLog(prev => [`${new Date().toLocaleTimeString()} — ${text}`, ...prev].slice(0, 80));
  }

  async function sendBotMessage(msg) {
    if (!msg || msg.trim().length === 0) return;
    try {
      const res = await fetch(`${CONFIG.API_BASE}/trigger_query`, {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ message: msg })
      });
      if (res.ok) pushLog('BOT mesajı gönderildi: ' + msg);
      else pushLog('BOT gönderim hatası');
    } catch (e) {
      pushLog('Network error: ' + e.message);
    }
  }

  function handleWsMessage(text) {
    try {
      const msg = JSON.parse(text);
      if (msg.type === 'price' && msg.data) {
        const d = msg.data;
        setGram(d.gram ?? '--');
        setOns(d.ons ?? '--');
        setUsd(d.usd ?? '--');
        setGumus(d.gumus ?? '--');
      } else if (msg.type === 'bot_reply') {
        const r = msg.reply || msg.text || JSON.stringify(msg);
        setBotReplies(prev => [r, ...prev].slice(0, 50));
        pushLog('🤖 BOT: ' + r);
      }
    } catch (e) {
      pushLog('WS parse error');
    }
  }

  function connectWs() {
    try {
      const ws = new WebSocket(CONFIG.WS_URL);
      wsRef.current = ws;
      ws.onopen = () => pushLog('WebSocket bağlı');
      ws.onmessage = evt => handleWsMessage(evt.data);
      ws.onerror = () => pushLog('WebSocket hata');
      ws.onclose = () => pushLog('WebSocket kapandı');
    } catch (e) {
      pushLog('WS bağlantı hatası');
    }
  }

  useEffect(() => {
    connectWs();
    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>AlSat Pro</Text>
        <Text style={styles.subtitle}>Gerçek zamanlı altın & bot</Text>
      </View>

      <ScrollView style={styles.body}>
        <View style={styles.cardBig}>
          <Text style={styles.cardTitle}>Gram Altın</Text>
          <Text style={styles.cardValue}>{gram} TL</Text>
          <Text style={styles.small}>Ons: {ons}  |  USD: {usd}</Text>
        </View>

        <View style={styles.cardBig}>
          <Text style={styles.cardTitle}>Gümüş</Text>
          <Text style={styles.cardValue}>{gumus} TL</Text>
        </View>

        <TouchableOpacity style={styles.primaryBtn} onPress={() => sendBotMessage('Fırsat mı?')}>
          <Text style={styles.primaryBtnText}>Bot'a Sor</Text>
        </TouchableOpacity>

        <View style={styles.manualBox}>
          <Text style={styles.cardTitle}>Manuel Mesaj</Text>
          <TextInput
            style={styles.input}
            placeholder="örn: gram, fırsat"
            placeholderTextColor="#6c7a99"
            value={manualMsg}
            onChangeText={setManualMsg}
          />
          <TouchableOpacity style={styles.secondaryBtn} onPress={() => sendBotMessage(manualMsg)}>
            <Text style={styles.secondaryBtnText}>Gönder</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.logBox}>
          <Text style={styles.cardTitle}>Bot Cevapları</Text>
          {botReplies.map((b, i) => (
            <Text key={'b'+i} style={styles.botReply}>🤖 {b}</Text>
          ))}
          <Text style={{marginTop:8, color:'#9aa3b2'}}>Log</Text>
          {log.map((l, i) => (
            <Text key={'l'+i} style={styles.logLine}>{l}</Text>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:{flex:1, backgroundColor:'#0b1220'},
  header:{padding:20, paddingTop:30},
  title:{color:'#ffd700', fontSize:28, fontWeight:'700'},
  subtitle:{color:'#9aa3b2', marginTop:6},
  body:{padding:20},
  cardBig:{backgroundColor:'#091020', padding:20, borderRadius:14, marginBottom:14, borderWidth:1, borderColor:'#1a2540'},
  cardTitle:{color:'#c6d0df', fontWeight:'700', fontSize:15},
  cardValue:{color:'#fff', fontSize:26, marginTop:8, fontWeight:'800'},
  small:{marginTop:6, color:'#7d8aa3'},
  primaryBtn:{backgroundColor:'#ffd700', padding:15, borderRadius:14, alignItems:'center', marginBottom:12},
  primaryBtnText:{fontWeight:'900'},
  manualBox:{marginTop:16, backgroundColor:'#061022', padding:12, borderRadius:12},
  input:{backgroundColor:'#0b1226', padding:12, borderRadius:10, color:'#fff', marginTop:10},
  secondaryBtn:{marginTop:10, backgroundColor:'#1b2b55', padding:12, borderRadius:10, alignItems:'center'},
  secondaryBtnText:{color:'#fff', fontWeight:'700'},
  logBox:{marginTop:20, backgroundColor:'#071024', padding:12, borderRadius:12},
  logLine:{color:'#9aa3b2', marginBottom:6},
  botReply:{color:'#cde9ff', marginBottom:8, fontWeight:'700'}
});
