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
      toast.success("Configurações salvas!");
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
      <label className="block text-xs tracking-wide text-ink-muted uppercase font-sans mb-2">{label}</label>
      <input
        type={type}
        value={values[settingKey] || ""}
        onChange={(e) => handleChange(settingKey, e.target.value)}
        placeholder={placeholder}
        className="w-full bg-cream-50 border border-cream-200 focus:border-gold/60 outline-none px-4 py-3 text-ink text-sm font-sans placeholder-ink/30 transition-colors"
      />
      {help && <p className="text-ink/30 text-xs mt-1 font-sans">{help}</p>}
    </div>
  );

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Store Settings */}
      <div className="bg-white border border-cream-200 p-6">
        <h2 className="font-serif text-xl text-ink mb-6">Dados da Loja</h2>
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

      {/* Dropshipping Automation */}
      <div className="bg-white border border-cream-200 p-6">
        <h2 className="font-serif text-xl text-ink mb-1">Automação do Fornecedor (Drop Automático)</h2>
        <p className="text-ink-muted text-sm font-sans mb-1">
          Configure o acesso ao site do seu fornecedor para envio automático dos pedidos.
        </p>
        <p className="text-gold-dark/80 text-xs font-sans mb-6">
          ✓ Compatível com franqueadosclubgo.com.br — clica &quot;Drop&quot; automaticamente.
        </p>

        <div className="space-y-4">
          <Field
            label="URL Base do Fornecedor"
            settingKey="dropshipping_supplier_base_url"
            placeholder="https://franqueadosclubgo.com.br/checkout/v3/start"
            help="URL base sem o ID do produto e o token"
          />
          <Field
            label="Token do Fornecedor"
            settingKey="dropshipping_supplier_token"
            placeholder="2cd7c96fc03c9a95dff9002a20f4fe534f1c7bb4"
            type="password"
            help="O hash/token que aparece na URL do checkout (é fixo por conta)"
          />

          <div className="pt-2">
            <p className="text-ink/30 text-xs font-sans mb-3">
              A URL de cada produto será construída automaticamente:
            </p>
            <div className="bg-cream-100 p-3 font-mono text-xs text-ink-muted break-all">
              {values["dropshipping_supplier_base_url"] || "https://franqueadosclubgo.com.br/checkout/v3/start"}
              /<span className="text-gold-dark/80">{"{ID_PRODUTO_FORNECEDOR}"}</span>
              /<span className="text-gold/40">{values["dropshipping_supplier_token"] ? "••••••••" : "{TOKEN}"}</span>
              ?from_store=1&amp;country=BR
            </div>
          </div>

          <div className="pt-2 border-t border-cream-200">
            <p className="text-ink-muted text-xs font-sans mb-3">
              Credenciais de acesso ao portal do fornecedor (opcional — apenas se o site exigir login)
            </p>
            <div className="grid grid-cols-2 gap-4">
              <Field
                label="E-mail do Fornecedor"
                settingKey="dropshipping_supplier_email"
                placeholder="seu@email.com"
                type="email"
                help="Login no site do fornecedor"
              />
              <Field
                label="Senha do Fornecedor"
                settingKey="dropshipping_supplier_password"
                placeholder="••••••••"
                type="password"
                help="Senha do portal"
              />
            </div>
          </div>
        </div>

        <div className="mt-4 p-4 bg-gold/5 border border-gold/20">
          <p className="text-gold-dark text-xs font-sans font-medium mb-1">Como funciona a automação:</p>
          <ol className="text-ink-muted text-xs font-sans space-y-1 list-decimal list-inside">
            <li>Cada produto precisa ter o &quot;ID do Fornecedor&quot; preenchido (em Admin → Produtos)</li>
            <li>Quando um pedido é pago, clique no botão &quot;Auto&quot; nos Pedidos</li>
            <li>O sistema abre o checkout do fornecedor, preenche os dados do cliente, marca &quot;Estou fazendo DROP&quot; e finaliza</li>
            <li>O número do pedido é capturado e o pedido é registrado como enviado automaticamente</li>
            <li>Uma mensagem é enviada via WhatsApp para sua atendente de suporte (se configurada abaixo)</li>
          </ol>
        </div>
      </div>

      {/* WhatsApp Notification */}
      <div className="bg-white border border-cream-200 p-6">
        <h2 className="font-serif text-xl text-ink mb-1">Notificação por WhatsApp</h2>
        <p className="text-ink-muted text-sm font-sans mb-6">
          Após o drop ser concluído, uma mensagem é enviada automaticamente para sua atendente de suporte
          com o número do pedido, dados do cliente e endereço do CD para usar como remetente.
        </p>

        <div className="space-y-4">
          <Field
            label="WhatsApp da Atendente de Suporte"
            settingKey="dropshipping_support_whatsapp"
            placeholder="5562999999999"
            help="Número com código do país (55) e DDD, sem espaços ou traços"
          />

          <div className="pt-2 border-t border-cream-200">
            <p className="text-ink-muted text-xs font-sans mb-3">
              Configuração Z-API (para envio totalmente automático sem clicar). Se não configurar, o
              sistema vai gerar um link wa.me para você clicar e enviar.
            </p>
            <div className="space-y-3">
              <Field
                label="URL da Z-API"
                settingKey="dropshipping_zap_api_url"
                placeholder="https://api.z-api.io"
                help="Endereço da API (mantenha o padrão se usar Z-API.io)"
              />
              <div className="grid grid-cols-2 gap-4">
                <Field
                  label="Instance ID"
                  settingKey="dropshipping_zap_instance"
                  placeholder="3DXXXXXX"
                  help="ID da instância (encontre no painel Z-API)"
                />
                <Field
                  label="Token Z-API"
                  settingKey="dropshipping_zap_api_token"
                  placeholder="••••••••••••••••"
                  type="password"
                  help="Token de autenticação"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 p-4 bg-gold/5 border border-gold/20">
          <p className="text-gold-dark text-xs font-sans font-medium mb-1">Mensagem que será enviada:</p>
          <pre className="text-ink-muted text-xs font-sans whitespace-pre-wrap">
{`*NOVO DROP - Pedido #12345*

📦 Produto: Sauvage Dior 100ml
👤 Cliente: João da Silva
📍 Endereço: Rua X, 123, Bairro, Cidade-UF, CEP

Remetente (usar endereço do CD):
Av. Contorno, QD 35 Lt 39/40 Sala 6
Jardim Colorado - Goiânia GO
CEP 74474-100

📐 Dimensões: 13x13x13cm | Peso: ~500g`}
          </pre>
        </div>
      </div>

      {/* Legacy API (optional) */}
      <div className="bg-white border border-cream-200 p-6">
        <h2 className="font-serif text-xl text-ink mb-2">API do Fornecedor (Alternativo)</h2>
        <p className="text-ink-muted text-sm font-sans mb-6">
          Somente se o fornecedor disponibilizar uma API REST. Deixe em branco se usar automação acima.
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
            <label className="block text-xs tracking-wide text-ink-muted uppercase font-sans mb-2">Tipo de Autenticação</label>
            <select
              value={values["dropshipping_auth_type"] || "api_key"}
              onChange={(e) => handleChange("dropshipping_auth_type", e.target.value)}
              className="w-full bg-cream-50 border border-cream-200 focus:border-gold/60 outline-none px-4 py-3 text-ink text-sm font-sans transition-colors"
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
        <div className="mt-6 pt-6 border-t border-cream-200">
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
                Testar Conexão API
              </>
            )}
          </button>

          {testResult && (
            <div className={`mt-4 p-4 flex items-center gap-3 border ${testResult.success ? "border-green-500/30 bg-green-500/5" : "border-red-500/30 bg-red-500/5"}`}>
              {testResult.success ? (
                <CheckCircle size={18} className="text-green-700 flex-shrink-0" />
              ) : (
                <XCircle size={18} className="text-red-500 flex-shrink-0" />
              )}
              <p className={`text-sm font-sans ${testResult.success ? "text-green-700" : "text-red-500"}`}>
                {testResult.message}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Melhor Envio */}
      <div className="bg-white border border-cream-200 p-6">
        <h2 className="font-serif text-xl text-ink mb-1">Etiquetas de Postagem — Melhor Envio</h2>
        <p className="text-ink-muted text-sm font-sans mb-6">
          Após o drop ser confirmado, o sistema gera a etiqueta automaticamente e envia o link para a atendente via WhatsApp.
        </p>

        <div className="space-y-4">
          <Field
            label="Token de Acesso (Melhor Envio)"
            settingKey="melhorenvio_token"
            placeholder="eyJ0eXAiOiJKV1QiLCJhbGc..."
            type="password"
            help="Gere em: melhorenvio.com.br → Configurações → Tokens e API"
          />

          <div>
            <label className="block text-xs tracking-wide text-ink-muted uppercase font-sans mb-2">Ambiente</label>
            <select
              value={values["melhorenvio_sandbox"] || "false"}
              onChange={(e) => handleChange("melhorenvio_sandbox", e.target.value)}
              className="w-full bg-cream-50 border border-cream-200 focus:border-gold/60 outline-none px-4 py-3 text-ink text-sm font-sans transition-colors"
            >
              <option value="false">Produção (conta real)</option>
              <option value="true">Sandbox (testes)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs tracking-wide text-ink-muted uppercase font-sans mb-2">Serviço Padrão de Entrega</label>
            <select
              value={values["melhorenvio_service"] || "1"}
              onChange={(e) => handleChange("melhorenvio_service", e.target.value)}
              className="w-full bg-cream-50 border border-cream-200 focus:border-gold/60 outline-none px-4 py-3 text-ink text-sm font-sans transition-colors"
            >
              <option value="1">Correios PAC (mais barato)</option>
              <option value="2">Correios SEDEX (mais rápido)</option>
              <option value="3">Jadlog .Package</option>
              <option value="4">Jadlog .Com</option>
              <option value="17">Azul Cargo</option>
            </select>
            <p className="text-ink/30 text-xs mt-1 font-sans">O mais barato disponível será usado caso este não atenda ao CEP</p>
          </div>
        </div>

        <div className="mt-4 p-4 bg-gold/5 border border-gold/20">
          <p className="text-gold-dark text-xs font-sans font-medium mb-2">Como obter o Token do Melhor Envio:</p>
          <ol className="text-ink-muted text-xs font-sans space-y-1 list-decimal list-inside">
            <li>Acesse melhorenvio.com.br e faça login</li>
            <li>Vá em Configurações → Tokens e API</li>
            <li>Clique em &quot;Gerar token&quot;</li>
            <li>Selecione as permissões: Envios (leitura e escrita), Carrinho (leitura e escrita)</li>
            <li>Copie o token e cole acima</li>
          </ol>
          <p className="text-ink/30 text-xs font-sans mt-2">
            ⚠️ Certifique-se de ter saldo em sua conta Melhor Envio para comprar as etiquetas.
          </p>
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
