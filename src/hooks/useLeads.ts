import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface LeadData {
  nome: string;
  email: string;
  telefone?: string;
  empresa?: string;
  cargo?: string;
  mensagem?: string;
  quantidadeCartoes?: string;
  principalDor?: string;
  tipoConsorcio?: string;
  principalObjetivo?: string;
  origem?: string;
  metadata?: Record<string, unknown>;
}

const TIPO_CONSORCIO_LABELS: Record<string, string> = {
  imoveis: "Imóveis",
  automoveis: "Automóveis",
  investimento: "Investimento",
};

const resolveTipoConsorcio = (lead: LeadData): string | undefined => {
  const fromMeta = lead.metadata?.tipoConsorcio;
  if (typeof fromMeta === "string" && fromMeta) return fromMeta;
  if (lead.tipoConsorcio) return lead.tipoConsorcio;
  const origem = lead.origem || "";
  const m = origem.match(
    /simulacao_(?:whatsapp_)?(imoveis|automoveis|investimento)/
  );
  return m ? m[1] : undefined;
};

const STORAGE_KEY = 'pending_leads';

// Detectar se está em produção
// Verifica múltiplas condições para garantir detecção correta
const isProduction = (): boolean => {
  // 1. Verifica se está em modo produção do Vite
  if (import.meta.env.PROD) return true;
  
  // 2. Verifica se não está em localhost
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname !== 'localhost' && hostname !== '127.0.0.1' && !hostname.includes('192.168.')) {
      return true;
    }
  }
  
  // 3. Verifica variável de ambiente customizada (pode ser configurada no Vercel)
  if (import.meta.env.VITE_ENVIRONMENT === 'production') {
    return true;
  }
  
  return false;
};

/**
 * Desenvolvimento: SEMPRE URL relativa → mesmo host do Vite → proxy em vite.config
 * encaminha para o n8n (host.docker.internal:5678 ou N8N_WEBHOOK_TARGET).
 * Nunca chame http://host.docker.internal/... direto do navegador: CORS bloqueia.
 * Produção: /api/webhook/lead (servidor) → LEAD_WEBHOOK_URL no Vercel.
 */
const WEBHOOK_PATH_DEV = "/webhook-test/consorcio";

const getWebhookUrl = (): string => {
  if (isProduction()) {
    return "/api/webhook/lead";
  }
  return WEBHOOK_PATH_DEV;
};

// Chamar webhook do n8n
const callLeadWebhook = async (leadData: LeadData) => {
  try {
    const webhookUrl = getWebhookUrl();
    
    if (!webhookUrl) {
      console.warn('⚠️ URL do webhook não configurada');
      return;
    }

    const tipoConsorcio = resolveTipoConsorcio(leadData);
    const tipoConsorcioLabel = tipoConsorcio
      ? TIPO_CONSORCIO_LABELS[tipoConsorcio] || tipoConsorcio
      : "Contato geral";

    const metadataMerged: Record<string, unknown> = {
      ...(leadData.metadata || {}),
      tipoConsorcio: tipoConsorcio ?? leadData.metadata?.tipoConsorcio,
      principalObjetivo: leadData.principalObjetivo ?? leadData.metadata?.principalObjetivo,
      quantidadeCartoes: leadData.quantidadeCartoes,
      principalDor: leadData.principalDor,
    };

    const tipoSimulacaoId = tipoConsorcio ?? null;

    const payload = {
      nome: leadData.nome,
      email: leadData.email,
      telefone: leadData.telefone,
      empresa: leadData.empresa,
      cargo: leadData.cargo,
      mensagem: leadData.mensagem,
      quantidadeCartoes: leadData.quantidadeCartoes,
      principalDor: leadData.principalDor,
      tipoSimulacaoId,
      tipoConsorcio: tipoSimulacaoId,
      tipoConsorcioLabel,
      principalObjetivo: leadData.principalObjetivo,
      origem: leadData.origem || "formulario_site",
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      metadata: metadataMerged,
    };

    const environment = isProduction() ? "PRODUÇÃO" : "DESENVOLVIMENTO";
    console.log(
      `🚀 [${environment}] POST webhook:`,
      webhookUrl,
      isProduction() ? "" : "(proxy Vite → n8n, veja N8N_WEBHOOK_TARGET no .env)"
    );
    console.log('📦 Payload:', payload);

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json, text/plain, */*",
      },
      body: JSON.stringify(payload),
    });

    console.log('📡 Resposta do webhook:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });

    if (!response.ok) {
      let errorText = "Sem resposta";
      try {
        const errorData = await response.json();
        errorText =
          errorData.message || errorData.error || JSON.stringify(errorData);
      } catch {
        errorText = await response.text().catch(() => "Sem resposta");
      }

      if (
        response.status === 404 ||
        errorText.includes("not registered") ||
        errorText.includes("not found")
      ) {
        console.warn("⚠️ Webhook não encontrado no n8n. Verifique URL, workflow ativo e método POST.");
        console.warn(`   URL usada: ${webhookUrl}`);
      }

      throw new Error(`Webhook retornou status ${response.status}: ${errorText}`);
    }

    const raw = await response.text();
    let responseData: unknown = null;
    if (raw) {
      try {
        responseData = JSON.parse(raw) as unknown;
      } catch {
        responseData = raw;
      }
    }
    console.log(`✅ [${environment}] Webhook OK`, responseData);
  } catch (error: any) {
    console.error('❌ Erro ao chamar webhook n8n:', error);
    console.error('Detalhes:', {
      message: error.message,
      stack: error.stack,
      environment: isProduction() ? 'PRODUÇÃO' : 'DESENVOLVIMENTO',
      hostname: typeof window !== 'undefined' ? window.location.hostname : 'N/A',
      viteProd: import.meta.env.PROD,
      viteMode: import.meta.env.MODE
    });
    // Não bloqueia o salvamento do lead se o webhook falhar
  }
};

// Salvar lead no localStorage como fallback
const saveToLocalStorage = (lead: LeadData) => {
  try {
    const pending = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    pending.push({
      ...lead,
      timestamp: new Date().toISOString(),
      synced: false
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pending));
    return true;
  } catch (error) {
    console.error('Erro ao salvar no localStorage:', error);
    return false;
  }
};

// Tentar sincronizar leads pendentes do localStorage
export const syncPendingLeads = async () => {
  try {
    const pending = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    const unsynced = pending.filter((lead: any) => !lead.synced);
    
    if (unsynced.length === 0) return;

    for (const lead of unsynced) {
      try {
        const { error } = await supabase
          .from('leads')
        .insert([{
          nome: lead.nome,
          email: lead.email,
          telefone: lead.telefone,
          empresa: lead.empresa,
          cargo: lead.cargo,
          mensagem: lead.mensagem,
          origem: lead.origem || 'formulario_site',
          metadata: {
            ...lead.metadata,
            quantidadeCartoes: lead.quantidadeCartoes,
            principalDor: lead.principalDor
          }
        }]);

        if (!error) {
          lead.synced = true;
        }
      } catch (error) {
        console.error('Erro ao sincronizar lead:', error);
      }
    }

    // Atualizar localStorage removendo leads sincronizados
    const stillPending = pending.filter((lead: any) => !lead.synced);
    if (stillPending.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stillPending));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch (error) {
    console.error('Erro ao sincronizar leads pendentes:', error);
  }
};

export const useCreateLead = () => {
  const [isLoading, setIsLoading] = useState(false);

  const createLead = async (leadData: LeadData) => {
    setIsLoading(true);
    let savedToDatabase = false;
    let savedToLocalStorage = false;

    try {
      try {
        const { data, error } = await supabase
          .from("leads")
          .insert([
            {
              nome: leadData.nome,
              email: leadData.email,
              telefone: leadData.telefone,
              empresa: leadData.empresa,
              cargo: leadData.cargo,
              mensagem: leadData.mensagem,
              origem: leadData.origem || "formulario_site",
              metadata: {
                ...leadData.metadata,
                quantidadeCartoes: leadData.quantidadeCartoes,
                principalDor: leadData.principalDor,
                tipoConsorcio: leadData.tipoConsorcio ?? leadData.metadata?.tipoConsorcio,
                principalObjetivo: leadData.principalObjetivo,
                userAgent: navigator.userAgent,
                timestamp: new Date().toISOString(),
                url: window.location.href,
              },
            },
          ])
          .select()
          .single();

        if (error) throw error;

        savedToDatabase = true;
        console.log("✅ Lead salvo no banco:", data);
      } catch (error: unknown) {
        console.error("❌ Erro ao salvar no Supabase:", error);
        savedToLocalStorage = saveToLocalStorage(leadData);
        if (savedToLocalStorage) {
          console.log("💾 Lead salvo no localStorage como fallback");
          setTimeout(() => syncPendingLeads(), 2000);
        }
      }
    } finally {
      await callLeadWebhook(leadData);
      setIsLoading(false);
    }

    return {
      success: savedToDatabase || savedToLocalStorage,
      savedToDatabase,
      savedToLocalStorage,
    };
  };

  return { createLead, isLoading };
};
