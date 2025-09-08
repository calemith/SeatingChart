import React from 'react';
import Theater from './components/Theater';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Good Friend Theater</h1>
      </header>
      <main style={{ padding: '20px' }}>
        <Theater />
      </main>
    </div>
  );
}

export default App;
