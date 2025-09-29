export default function App() {
  return (
    <div>
      {/* Navbar */}
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
        <div className="container">
          <a className="navbar-brand" href="#">My React + Vite App</a>
        </div>
      </nav>

      {/* Main content */}
      <div className="container mt-4">
        <h1 className="mb-4">Welcome to React + Bootstrap</h1>

        {/* Bootstrap Card */}
        <div className="card shadow">
          <div className="card-body">
            <h5 className="card-title">Hello, world!</h5>
            <p className="card-text">
              This app is styled with Bootstrap 5 and powered by Vite + React.
            </p>
            <button className="btn btn-primary">Click Me</button>
          </div>
        </div>
      </div>
    </div>
  )
}
