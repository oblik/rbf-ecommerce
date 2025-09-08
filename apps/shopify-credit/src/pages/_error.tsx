function Error({ statusCode }: { statusCode: number }) {
  return (
    <div style={{ 
      fontFamily: 'system-ui, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      height: '100vh',
      textAlign: 'center',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <h1>{statusCode ? `${statusCode} - Server Error` : 'Client Error'}</h1>
      <p>Something went wrong. Please try again later.</p>
    </div>
  );
}

Error.getInitialProps = ({ res, err }: any) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode };
};

export default Error;