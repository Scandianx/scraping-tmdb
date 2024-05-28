import fetch from 'node-fetch';
import mongoose from 'mongoose';

// Configurações
const api_key = 'd30bec7362587653667057860a7c436f'; // Substitua pela sua chave de API do TMDb
const total_pages = 50; // Número total de páginas a serem buscadas (cada página retorna 20 filmes)

// Função para buscar filmes de uma página específica da API
async function getMoviesFromPage(page) {
    const url = `https://api.themoviedb.org/3/movie/popular?api_key=${api_key}&page=${page}`;
    const response = await fetch(url);
    const data = await response.json();
    return data.results || [];
}

// Função para conectar ao MongoDB
async function connectToMongoDB() {
    try {
        await mongoose.connect('mongodb://localhost:27017/moviesDB', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('Conectado ao MongoDB');
    } catch (error) {
        console.error('Erro ao conectar ao MongoDB:', error);
    }
}

// Definição do modelo de filme no MongoDB usando mongoose
const MovieSchema = new mongoose.Schema({
    title: String,
    overview: String,
    poster_path: String,
    release_date: String,
    vote_average: Number
});

const Movie = mongoose.model('Movie', MovieSchema);

// Função principal para buscar e armazenar filmes
async function fetchAndStoreMovies() {
    await connectToMongoDB();

    let allMovies = [];

    // Loop sobre cada página da API
    for (let page = 1; page <= total_pages; page++) {
        try {
            const movies = await getMoviesFromPage(page);
            allMovies = [...allMovies, ...movies];
        } catch (error) {
            console.error(`Erro ao buscar filmes da página ${page}:`, error);
        }
    }

    // Inserir filmes no MongoDB
    if (allMovies.length > 0) {
        try {
            await Movie.insertMany(allMovies);
            console.log(`${allMovies.length} filmes inseridos no MongoDB com sucesso.`);
        } catch (error) {
            console.error('Erro ao inserir filmes no MongoDB:', error);
        }
    } else {
        console.warn('Nenhum filme encontrado para inserir.');
    }
    
    // Fechar conexão com o MongoDB
    try {
        await mongoose.disconnect();
        console.log('Conexão com o MongoDB fechada.');
    } catch (error) {
        console.error('Erro ao fechar conexão com o MongoDB:', error);
    }
}

// Executar a função principal
fetchAndStoreMovies().catch(err => console.error('Erro principal:', err));
