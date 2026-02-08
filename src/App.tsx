import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { TeacherView } from './components/TeacherView';
import { StudentView } from './components/StudentView';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/teacher" element={<TeacherView />} />
        <Route path="/display" element={<StudentView />} />
        <Route path="/" element={<TeacherView />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
