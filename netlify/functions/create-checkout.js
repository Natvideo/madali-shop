const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
  // Accepter uniquement les requêtes POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Méthode non autorisée' };
  }

  try {
    const { items } = JSON.parse(event.body);

    // Transformation des articles du panier pour l'API Stripe
    const lineItems = items.map(item => {
      // On s'assure d'avoir une quantité valide (au moins 1)
      const qty = parseInt(item.quantity || item.qty || 1, 10);

      return {
        price_data: {
          currency: 'eur',
          product_data: {
            name: item.nm || item.name || item.title || 'Produit BodyNature',
          },
          unit_amount: Math.round((item.price || 0) * 100), // conversion en centimes
        },
        quantity: qty > 0 ? qty : 1, // Garantit une quantité >= 1
      };
    });

    // Récupération dynamique de l'URL d'origine
    const origin = event.headers.origin || event.headers.referer || 'https://madaliservice-shop.netlify.app';

    // Création de la session Checkout Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      shipping_address_collection: {
        allowed_countries: ['FR', 'BE', 'CH', 'LU', 'MC'],
      },
      phone_number_collection: {
        enabled: true,
      },
      success_url: `${origin}/success.html`,
      cancel_url: `${origin}/index.html`,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ url: session.url }),
    };
  } catch (error) {
    console.error('Erreur Stripe:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
