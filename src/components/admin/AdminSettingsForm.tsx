"use client";

import { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { Save, TestTube2, CheckCircle, XCircle } from "lucide-react";

interface Props {
  settings: Record<string, string>;
}

export function AdminSettingsForm({ settings }: Props) {
  const [values, setValues] = useState(settings);
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [testing, setTesting] = useState(false);

  const handleChange = (key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      await axios.post("/api/settings", { settings: values });
      toast.success("Configurações salvas!", {
        style: { background: "#1a1a1a", color: "#C9A84C", border: "1px solid #2a2a2a" },
      });
    } catch {
      toast.error("Erro ao salvar configurações");
    } finally {
      setLoading(false);
    }
  };

  const handleTestDropshipping = async () => {
    try {
      setTesting(true);
      setTestResult(null);
      await axios.post("/api/settings", { settings: values });
      const response = await axios.get("/api/dropshipping/test");
      setTestResult(response.data);
    } catch {
      setTestResult({ success: false, message: "Erro ao testar conexão" });
    } finally {
      setTesting(false);
    }
  };

  const Field = ({ label, settingKey, placeholder, type = "text", help }: {
    label: string;
    settingKey: string;
    placeholder?: string;
    type?: string;
    help?: string;
  }) => (
    <div>
      <label className="block text-xs tracking-wide text-white/50 uppercase font-sans mb-2">{label}</label>
      <input
        type={type}
        value={values[settingKey] || ""}
        onChange={(e) => handleChange(settingKey, e.target.value)}
        placeholder={placeholder}
        className="w-full bg-dark-200 border border-dark-300 focus:border-gold/50 outline-none px-4 py-3 text-white text-sm font-sans placeholder-white/20 transition-colors"
      />
      {help && <p className="text-white/30 text-xs mt-1 font-sans">{help}</p>}
    </div>
  );

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Store Settings */}
      <div className="bg-dark-100 border border-dark-300 p-6">
        <h2 className="font-serif text-xl text-white mb-6">Dados da Loja</h2>
        <div className="space-y-4">
          <Field label="Nome da Loja" settingKey="store_name" placeholder="Maison Parfums" />
          <Field label="E-mail de Contato" settingKey="store_email" placeholder="contato@sualore.com.br" type="email" />
          <Field label="WhatsApp (com código do país)" settingKey="store_whatsapp" placeholder="5511999999999" />
          <Field label="Instagram" settingKey="store_instagram" placeholder="@sualore" />
          <div className="grid grid-cols-2 gap-4">
            <Field label="Frete Grátis Acima de (R$)" settingKey="free_shipping_above" placeholder="500" />
            <Field label="Valor do Frete (R$)" settingKey="shipping_price" placeholder="25" />
          </div>
        </div>
      </div>

      {/* Dropshipping */}
      <div className="bg-dark-100 border border-dark-300 p-6">
        <h2 className="font-serif text-xl text-white mb-2">Integração Dropshipping</h2>
        <p className="text-white/40 text-sm font-sans mb-6">
          Configure a API do seu fornecedor. Quando um pedido for pago, ele será enviado automaticamente.
        </p>

        <div className="space-y-4">
          <Field
            label="URL da API do Fornecedor"
            settingKey="dropshipping_api_url"
            placeholder="https://api.seufornecedor.com.br"
            help="URL base da API (sem barra no final)"
          />
          <Field
            label="Chave de API / Token"
            settingKey="dropshipping_api_key"
            placeholder="sk_live_..."
            type="password"
          />

          <div>
            <label className="block text-xs tracking-wide text-white/50 uppercase font-sans mb-2">Tipo de Autenticação</label>
            <select
              value={values["dropshipping_auth_type"] || "api_key"}
              onChange={(e) => handleChange("dropshipping_auth_type", e.target.value)}
              className="w-full bg-dark-200 border border-dark-300 focus:border-gold/50 outline-none px-4 py-3 text-white text-sm font-sans transition-colors"
            >
              <option value="api_key">API Key (Header X-API-Key)</option>
              <option value="bearer">Bearer Token (Authorization: Bearer)</option>
              <option value="basic">Basic Auth (Authorization: Basic)</option>
            </select>
          </div>

          <Field
            label="Endpoint de Criação de Pedido"
            settingKey="dropshipping_order_endpoint"
            placeholder="/orders"
            help="Rota da API para criar pedidos (ex: /orders, /api/order)"
          />
        </div>

        {/* Test connection */}
        <div className="mt-6 pt-6 border-t border-dark-300">
          <button
            onClick={handleTestDropshipping}
            disabled={testing}
            className="btn-outline-gold px-6 py-3 flex items-center gap-2 text-sm tracking-wide uppercase disabled:opacity-50"
          >
            {testing ? (
              <span className="animate-pulse">Testando...</span>
            ) : (
              <>
                <TestTube2 size={16} />
                Testar Conexão
              </>
            )}
          </button>

          {testResult && (
            <div className={`mt-4 p-4 flex items-center gap-3 border ${testResult.success ? "border-green-500/30 bg-green-500/5" : "border-red-500/30 bg-red-500/5"}`}>
              {testResult.success ? (
                <CheckCircle size={18} className="text-green-400 flex-shrink-0" />
              ) : (
                <XCircle size={18} className="text-red-400 flex-shrink-0" />
              )}
              <p className={`text-sm font-sans ${testResult.success ? "text-green-400" : "text-red-400"}`}>
                {testResult.message}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Save */}
      <button
        onClick={handleSave}
        disabled={loading}
        className="btn-gold px-10 py-4 flex items-center gap-2 text-sm tracking-wider uppercase disabled:opacity-50"
      >
        {loading ? <span className="animate-pulse">Salvando...</span> : (
          <>
            <Save size={16} />
            Salvar Configurações
          </>
        )}
      </button>
    </div>
  );
}
