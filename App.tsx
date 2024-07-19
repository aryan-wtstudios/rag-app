import { Button } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native'; // Removed unused Text import
import supabase from './src/lib/supabase';

export default function App() {
  const [query, setQuery] = useState('');

  const runPrompt = async () => {
    console.log(query);
    const { data, error } = await supabase.functions.invoke("prompt", {
      body: { query }
    });
    if (error)
      console.log(error);
    else
      console.log(data);
  }

  return (
    <View style={styles.container}>
      <TextInput
        placeholder='prompt'
        value={query}
        onChangeText={setQuery}
        style={{
          padding: 20,
          borderRadius: 5,
          borderColor: "black",
          borderWidth: 1,
        }}
      />
      <Button title="Run" onPress={runPrompt} />
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    justifyContent: 'center',
  },
});
