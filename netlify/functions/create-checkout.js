const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  // Accepter uniquement les requêtes POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 450, body: 'Méthode non autorisée' };
  }

  try {
    const { items } = JSON.parse(event.body);

    // Transformation des articles du panier pour l'API Stripe
    const lineItems = items.map(item => ({
      price_data: {
        currency: 'eur',
        product_data: {
          name: item.name,
        },
        unit_amount: Math.round(item.price * 100), // conversion en centimes
      },
      quantity: item.quantity,
    }));

    // Création de la session Checkout Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${event.headers.origin}/success.html`, // Redirection en cas de succès
      cancel_url: `${event.headers.origin}/cart.html`,    // Redirection si annulation
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ url: session.url }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};