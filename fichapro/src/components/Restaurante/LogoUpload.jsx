import { useRef } from "react";

export default function LogoUpload({ logo, setLogo }) {
  const fileInput = useRef();

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogo(file);
    }
  };

  return (
    <div className="flex flex-col gap-6 items-center justify-center py-8">
      <input
        type="file"
        accept="image/*"
        ref={fileInput}
        onChange={handleFileChange}
        className="hidden"
      />
      <button
        type="button"
        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg shadow transition text-lg font-semibold"
        onClick={() => fileInput.current.click()}
      >
        Selecionar Logo
      </button>
      {logo && (
        <img src={typeof logo === "string" ? logo : URL.createObjectURL(logo)} alt="Logo Preview" className="w-40 h-40 object-contain border-2 border-gray-200 rounded-xl shadow-lg mt-4 bg-white" />
      )}
      {!logo && <span className="text-gray-400 text-sm">Nenhuma imagem selecionada</span>}
    </div>
  );
} 