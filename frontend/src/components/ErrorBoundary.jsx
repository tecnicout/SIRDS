import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // You can log the error to an external service here
    console.error('ErrorBoundary caught error:', error, info);
    this.setState({ info });
  }

  render() {
    if (this.state.hasError) {
      const { error, info } = this.state;
      return (
        <div style={{ padding: 24, fontFamily: 'Inter, Arial, sans-serif' }}>
          <h1 style={{ color: '#b91c1c' }}>Se produjo un error al renderizar la aplicación</h1>
          <p style={{ marginTop: 12 }}><strong>Mensaje:</strong> {String(error && error.message)}</p>
          {info && info.componentStack && (
            <details style={{ whiteSpace: 'pre-wrap', marginTop: 12 }}>
              <summary>Detalles de stack</summary>
              <pre style={{ fontSize: 12 }}>{info.componentStack}</pre>
            </details>
          )}
          <p style={{ marginTop: 12 }}>
            Abre la consola del navegador para ver más detalles. Pega aquí el mensaje para que lo revise.
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
