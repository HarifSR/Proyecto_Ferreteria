export default function LoginScreen({ email, setEmail, password, setPassword, manejarLogin }) {
  return (
    <div className="h-screen flex items-center justify-center">
      <div className="bg-white p-8 rounded-xl shadow-md border max-w-md w-full mx-4">
        <div className="text-center mb-6">
          <span className="brand-mark text-lg font-bold text-orange-600 tracking-tight">FerreSistema Pro</span>
          <h2 className="text-xl font-bold mt-3">Acceso Administrativo</h2>
          <p className="text-xs text-gray-400 mt-1">Ingresa tus credenciales para gestionar tu inventario.</p>
        </div>
        <form onSubmit={manejarLogin} className="space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-500">Correo electrónico</label>
            <input type="email" placeholder="tucorreo@ferreteria.com" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full p-2.5 border rounded-lg mt-1" />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500">Contraseña</label>
            <input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-2.5 border rounded-lg mt-1" />
          </div>
          <button type="submit" className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-2.5 rounded-lg transition">Ingresar</button>
        </form>
      </div>
    </div>
  );
}