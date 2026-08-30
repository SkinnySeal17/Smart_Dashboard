export default function Alert({ children }) {
  return (
    <div className="auth__alert" role="alert">
      {children}
    </div>
  );
}
