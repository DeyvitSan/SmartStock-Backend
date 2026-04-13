const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const messaging = admin.messaging();

async function sendStockAlert(tokens, productName, quantity) {
    if (tokens.length === 0) return;

    const message = {
        data: {
            productName: productName,
            quantity: String(quantity)
        },
        notification: {
            title: '⚠️ Stock bajo',
            body: `${productName} tiene solo ${quantity} unidades`
        },
        tokens: tokens
    };

    try {
        const response = await messaging.sendEachForMulticast(message);
        console.log(`Enviadas: ${response.successCount}, Fallidas: ${response.failureCount}`);
    } catch (error) {
        console.error('Error enviando notificaciones:', error);
    }
}

module.exports = { sendStockAlert };