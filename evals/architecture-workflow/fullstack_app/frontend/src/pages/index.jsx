import Dashboard from './Dashboard';

// Top-level route wires Dashboard with stub state. The real app would lift this
// into a context/store — this page-level prop drilling is itself one of the
// frontend anti-patterns the architecture review should flag.
export default function Home() {
  const stub = () => {};
  return (
    <Dashboard
      user={null}
      setUser={stub}
      projects={[]}
      setProjects={stub}
    />
  );
}
