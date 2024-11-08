require('dotenv').config();
const express = require('express');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const app = express();
const port = process.env.PORT || 3000;

function readData() {
    const data = fs.readFileSync('link.json', 'utf8');
    return JSON.parse(data);
}

function writeData(data) {
    fs.writeFileSync('link.json', JSON.stringify(data, null, 2));
}

// Middleware pour traiter les requêtes JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Route pour la page admin
app.get('/dilaraadminlabest', (req, res) => {
    const data = readData();
    res.send(`
        <html>
        <head>
            <title>Page Admin - Codeky</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    margin: 0;
                    padding: 0;
                    background-color: #f4f4f9;
                    color: #333;
                    text-align: center;
                }
                h1, h2, h3 {
                    color: #4CAF50;
                }
                ul {
                    list-style-type: none;
                    padding: 0;
                }
                ul li {
                    margin: 5px 0;
                }
                a {
                    text-decoration: none;
                    color: #4CAF50;
                }
                form {
                    margin: 20px 0;
                }
                textarea, button {
                    padding: 10px;
                    font-size: 1em;
                    margin-top: 10px;
                }
                textarea {
                    width: 80%;
                    height: 60px;
                }
                button {
                    background-color: #4CAF50;
                    color: white;
                    border: none;
                    cursor: pointer;
                }
                button:hover {
                    background-color: #45a049;
                }
                .link-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 10px;
                    border-bottom: 1px solid #ddd;
                }
            </style>
        </head>
        <body>
            <h1>Page Admin</h1>
            <h2>Redirections</h2>
            <ul>
                ${Object.keys(data).map(id => `
                    <li class="link-item">
                        <a href="/dilaraadminlabest/${id}">${id}</a>
                    </li>`).join('')}
            </ul>
            <form method="POST" action="/admin/add">
                <textarea name="urls" placeholder="Entrez plusieurs URLs, séparées par des virgules" required></textarea>
                <button type="submit">Ajouter des liens</button>
            </form>
        </body>
        </html>
    `);
});

// Route pour voir et gérer les redirections d'un `id` spécifique
app.get('/dilaraadminlabest/:id', (req, res) => {
    const data = readData();
    const id = req.params.id;
    const urls = data[id]?.urls;
    if (!urls) {
        return res.sendStatus(404);
    }
    res.send(`
        <html>
        <head>
            <title>Page Admin - Codeky</title>
            <style>
                body { font-family: Arial, sans-serif; background-color: #f4f4f9; color: #333; text-align: center; }
                h1, h2, h3 { color: #4CAF50; }
                ul { list-style-type: none; padding: 0; }
                li { margin: 10px 0; }
                form { display: inline; }
                button { padding: 5px 10px; color: #fff; background-color: #e53935; border: none; cursor: pointer; }
                button:hover { background-color: #c62828; }
                .link-item { display: flex; justify-content: space-between; align-items: center; padding: 10px; border-bottom: 1px solid #ddd; }
                textarea { width: 80%; margin-top: 10px; }
            </style>
        </head>
        <body>
            <h1>Page Admin</h1>
            <h2>Redirections</h2>
            <h3>Lien à partager: link.codeky.fr/${id}</h3>
            <ul>
                ${urls.map((url, index) => `
                    <li class="link-item">
                        ${url.url} - Visites : ${url.used}
                        <form method="POST" action="/admin/delete/${id}/${index}">
                            <button type="submit">Supprimer</button>
                        </form>
                    </li>
                `).join('')}
            </ul>
            <h3>Ajouter d'autres liens à cet ID</h3>
            <form method="POST" action="/admin/add-links/${id}">
                <textarea name="urls" placeholder="Entrez plusieurs URLs, séparées par des virgules" required></textarea>
                <button type="submit">Ajouter des liens</button>
            </form>
        </body>
        </html>
    `);
});

// Route pour rediriger vers une URL aléatoire d'un `id` spécifique
app.get('/:id', (req, res) => {
    const data = readData();
    const id = req.params.id;
    const urls = data[id]?.urls;
    if (!urls) {
        return res.sendStatus(404);
    }
    const choiceUrl = Math.floor(Math.random() * urls.length);
    urls[choiceUrl].used++;
    writeData(data);

    let url = urls[choiceUrl].url;

    if (!url.startsWith('http')) {
        url = `https://${url}`;
    }

    res.redirect(url);
});

// Route pour ajouter plusieurs liens avec un ID généré automatiquement
app.post('/admin/add', (req, res) => {
    const { urls } = req.body;
    if (!urls) {
        return res.status(400).send("Les URLs sont requises.");
    }
    const data = readData();
    const id = uuidv4();
    const urlList = urls.split(',').map(url => ({ url: url.trim(), used: 0 }));
    data[id] = { urls: urlList };
    writeData(data);
    res.redirect(`/dilaraadminlabest/${id}`);
});

// Nouvelle route pour ajouter des liens à un ID existant
app.post('/admin/add-links/:id', (req, res) => {
    const { urls } = req.body;
    const id = req.params.id;
    if (!urls) {
        return res.status(400).send("Les URLs sont requises.");
    }
    const data = readData();
    if (!data[id]) {
        return res.status(404).send("ID non trouvé.");
    }
    const newUrls = urls.split(',').map(url => ({ url: url.trim(), used: 0 }));
    data[id].urls.push(...newUrls);
    writeData(data);
    res.redirect(`/dilaraadminlabest/${id}`);
});

// Route pour supprimer un lien spécifique d'un ID donné
app.post('/admin/delete/:id/:index', (req, res) => {
    const { id, index } = req.params;
    const data = readData();
    if (data[id] && data[id].urls) {
        data[id].urls.splice(index, 1);
        if (data[id].urls.length === 0) {
            delete data[id];
            writeData(data);
            return res.redirect('/dilaraadminlabest');
        }
        writeData(data);
    }
    res.redirect(`/dilaraadminlabest/${id}`);
});

// Démarrer le serveur
app.listen(port, () => {
    console.log(`Serveur en cours d'exécution sur le port ${port}`);
});
