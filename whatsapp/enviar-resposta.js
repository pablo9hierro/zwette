/**
 * Envia resposta de volta para o cliente no WhatsApp
 */
async function enviarResposta(sock, destinatario, mensagem) {
    try {
        await sock.sendMessage(destinatario, { 
            text: mensagem 
        });
        
        console.log(`📤 Resposta enviada para: ${destinatario}`);
    } catch (error) {
        console.error('❌ Erro ao enviar mensagem:', error.message);
        throw error;
    }
}

export { enviarResposta };
