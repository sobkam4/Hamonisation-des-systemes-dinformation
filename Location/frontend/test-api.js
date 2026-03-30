// Test script pour vérifier la connexion à l'API
const fetch = require('node-fetch').default || require('node-fetch');

async function testAPI() {
  try {
    console.log('Test de connexion à l\'API...');
    
    // Test login
    const loginResponse = await fetch('http://localhost:8000/api/auth/login/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123'
      })
    });
    
    if (loginResponse.ok) {
      const data = await loginResponse.json();
      console.log('✅ Login réussi:', data);
      
      // Test récupération des biens
      const biensResponse = await fetch('http://localhost:8000/api/biens/', {
        headers: {
          'Authorization': `Bearer ${data.access}`,
          'Content-Type': 'application/json',
        }
      });
      
      if (biensResponse.ok) {
        const biens = await biensResponse.json();
        console.log('✅ Récupération des biens réussie:', biens.results?.length || 0, 'biens');
      } else {
        console.log('❌ Erreur récupération des biens:', biensResponse.status);
      }
    } else {
      console.log('❌ Erreur login:', loginResponse.status);
      const error = await loginResponse.text();
      console.log('Détail erreur:', error);
    }
  } catch (error) {
    console.error('❌ Erreur de connexion:', error.message);
  }
}

testAPI();
