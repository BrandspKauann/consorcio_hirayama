import type { VercelRequest, VercelResponse } from '@vercel/node';
import { OFFICIAL_LEAD_N8N_WEBHOOK_URL } from '../../src/config/leadWebhook';

interface LeadPayload {
  nome: string;
  email: string;
  telefone?: string;
  empresa?: string;
  cargo?: string;
  mensagem?: string;
  quantidadeCartoes?: string;
  principalDor?: string;
  tipoSimulacaoId?: string | null;
  tipoConsorcio?: string;
  tipoConsorcioLabel?: string;
  principalObjetivo?: string;
  origem?: string;
  timestamp?: string;
  url?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Apenas aceitar requisições POST
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      message: 'Apenas requisições POST são permitidas'
    });
  }

  try {
    // Único destino padrão: OFFICIAL_LEAD_N8N_WEBHOOK_URL (src/config/leadWebhook).
    // Opcional: LEAD_WEBHOOK_URL só se o host público do n8n for diferente (path deve ser /webhook/consorcio).
    const webhookUrl =
      process.env.LEAD_WEBHOOK_URL || OFFICIAL_LEAD_N8N_WEBHOOK_URL;

    // Validar payload
    const payload: LeadPayload = req.body;

    if (!payload.nome || !payload.email) {
      return res.status(400).json({
        error: 'Invalid payload',
        message: 'Nome e email são obrigatórios'
      });
    }

    // Preparar payload completo
    const fullPayload = {
      nome: payload.nome,
      email: payload.email,
      telefone: payload.telefone || '',
      empresa: payload.empresa || '',
      cargo: payload.cargo || '',
      mensagem: payload.mensagem || '',
      quantidadeCartoes: payload.quantidadeCartoes || '',
      principalDor: payload.principalDor || '',
      tipoSimulacaoId: payload.tipoSimulacaoId ?? payload.tipoConsorcio ?? null,
      tipoConsorcio: payload.tipoConsorcio || '',
      tipoConsorcioLabel: payload.tipoConsorcioLabel || '',
      principalObjetivo: payload.principalObjetivo || '',
      origem: payload.origem || 'formulario_site',
      timestamp: payload.timestamp || new Date().toISOString(),
      url: payload.url || '',
      userAgent: payload.userAgent || '',
      metadata: payload.metadata || {},
    };

    console.log('🚀 [Vercel API] Chamando webhook n8n:', webhookUrl);
    console.log('📦 [Vercel API] Payload:', JSON.stringify(fullPayload, null, 2));

    // Fazer requisição para o webhook do n8n
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(fullPayload),
    });

    console.log('📡 [Vercel API] Resposta do webhook:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    });

    // Verificar se a resposta foi bem-sucedida
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Sem resposta');
      
      console.error('❌ [Vercel API] Erro no webhook:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });

      // Verificar se o erro é de webhook não registrado
      if (response.status === 404 || errorText.includes('not registered')) {
        return res.status(404).json({
          error: 'Webhook not found',
          message: 'Webhook não encontrado no n8n. Verifique se o workflow está ativo.',
          details: errorText
        });
      }

      return res.status(response.status).json({
        error: 'Webhook request failed',
        message: `Webhook retornou status ${response.status}`,
        details: errorText
      });
    }

    // Tentar obter resposta JSON do webhook
    let responseData;
    try {
      responseData = await response.json();
    } catch {
      // Se não for JSON, retornar sucesso mesmo assim
      responseData = { success: true };
    }

    console.log('✅ [Vercel API] Webhook n8n chamado com sucesso!', responseData);

    // Retornar sucesso ao frontend
    return res.status(200).json({
      success: true,
      message: 'Webhook chamado com sucesso',
      data: responseData
    });

  } catch (error: any) {
    console.error('❌ [Vercel API] Erro ao chamar webhook n8n:', error);
    console.error('Detalhes:', {
      message: error.message,
      stack: error.stack
    });

    return res.status(500).json({
      error: 'Internal server error',
      message: 'Erro ao processar requisição do webhook',
      details: error.message
    });
  }
}
