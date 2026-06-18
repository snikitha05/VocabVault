import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { CreateDeck } from './pages/CreateDeck';
import { DeckDetails } from './pages/DeckDetails';
import { StudySession } from './pages/StudySession';

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/create" element={<CreateDeck />} />
        <Route path="/deck/:id" element={<DeckDetails />} />
        <Route path="/study/:deckId" element={<StudySession />} />
      </Routes>
    </Layout>
  );
}

export default App;
