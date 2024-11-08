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
app.get('/dilaraadminlabest', (req, res) => {
    const data = readData();
    res.send(`
        <html>
        <head>
            <title>Page Admin - Codeky</title>
            <style>
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    margin: 0;
                    padding: 0;
                    background-color: #f9fafc;
                    color: #333;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    min-height: 100vh;
                }
                .container {
                    width: 90%;
                    max-width: 700px;
                    margin: 20px auto;
                    background-color: #fff;
                    border-radius: 8px;
                    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                    padding: 20px;
                    text-align: center;
                }
                h1 {
                    color: #34495e;
                    font-size: 24px;
                    margin-bottom: 20px;
                }
                h2 {
                    color: #2c3e50;
                    font-size: 20px;
                    margin-bottom: 15px;
                }
                .link-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 10px;
                    background-color: #ecf0f1;
                    border-radius: 5px;
                    margin-bottom: 8px;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                    transition: background-color 0.3s;
                }
                .link-item:hover {
                    background-color: #dce1e5;
                }
                .link-item a {
                    color: #3498db;
                    text-decoration: none;
                    font-weight: bold;
                }
                form {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    margin-top: 20px;
                }
                textarea {
                    width: 100%;
                    padding: 10px;
                    border: 1px solid #bdc3c7;
                    border-radius: 5px;
                    font-size: 16px;
                    resize: none;
                    margin-bottom: 15px;
                }
                button {
                    padding: 10px 20px;
                    font-size: 16px;
                    background-color: #27ae60;
                    color: white;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                    transition: background-color 0.3s;
                }
                button:hover {
                    background-color: #2ecc71;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Page Admin - Gestion des Redirections</h1>
                <h2>Liens Disponibles</h2>
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
            </div>
        </body>
        </html>
    `);
});

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
            <title>Page Admin - Édition du Lien</title>
            <style>
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    margin: 0;
                    padding: 0;
                    background-color: #f9fafc;
                    color: #333;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    min-height: 100vh;
                }
                .container {
                    width: 90%;
                    max-width: 700px;
                    margin: 20px auto;
                    background-color: #fff;
                    border-radius: 8px;
                    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                    padding: 20px;
                    text-align: center;
                }
                h1 {
                    color: #34495e;
                    font-size: 24px;
                    margin-bottom: 20px;
                }
                h2 {
                    color: #2c3e50;
                    font-size: 20px;
                    margin-bottom: 15px;
                }
                .link-item {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 10px;
                    background-color: #ecf0f1;
                    border-radius: 5px;
                    margin-bottom: 8px;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                    transition: background-color 0.3s;
                }
                .link-item:hover {
                    background-color: #dce1e5;
                }
                .link-info {
                    text-align: left;
                    font-size: 14px;
                    color: #7f8c8d;
                }
                form {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    margin-top: 20px;
                }
                button {
                    padding: 8px 12px;
                    font-size: 14px;
                    background-color: #e74c3c;
                    color: white;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                    transition: background-color 0.3s;
                    margin-left: 5px;
                }
                button:hover {
                    background-color: #c0392b;
                }
                textarea {
                    width: 100%;
                    padding: 10px;
                    border: 1px solid #bdc3c7;
                    border-radius: 5px;
                    font-size: 16px;
                    resize: none;
                    margin-bottom: 15px;
                }
                .add-links button {
                    background-color: #27ae60;
                }
                .add-links button:hover {
                    background-color: #2ecc71;
                }
                .share-link {
                    display: block;
                    font-size: 18px;
                    margin-top: 15px;
                    color: #3498db;
                    text-decoration: none;
                    font-weight: bold;
                }
                .share-link:hover {
                    color: #2980b9;
                }
                .copy-button {
                    padding: 8px 12px;
                    font-size: 14px;
                    background-color: #3498db;
                    color: white;
                    border: none;
                    border-radius: 5px;
                    cursor: pointer;
                    transition: background-color 0.3s;
                    margin-top: 10px;
                }
                .copy-button:hover {
                    background-color: #2980b9;
                }
            </style>
            <script>
                function copyLink() {
                    let link = document.getElementById("shareLink").textContent;
                    link = link.trim();
                    
                    navigator.clipboard.writeText(link)
                }
            </script>
        </head>
        <body>
            <div class="container">
                <h1>Édition des Redirections</h1>
                <h2>ID : ${id}</h2>
                <div><span class="">Partager ce lien :</span>
                    <a id="shareLink" href="https://link.codeky.fr/${id}" target="_blank" class="share-link">
                        link.codeky.fr/${id}
                    </a>
                    <button onclick="copyLink()" class="copy-button">Copier le lien</button>
                </div>
                <ul>
                    ${urls.map((urlObj, index) => `
                        <li class="link-item">
                            <div>
                                <strong>${urlObj.url}</strong>
                                <div class="link-info">Visites : ${urlObj.used}</div>
                            </div>
                            <form method="POST" action="/admin/delete/${id}/${index}">
                                <button type="submit">Supprimer</button>
                            </form>
                        </li>
                    `).join('')}
                </ul>
                <h3>Ajouter de nouveaux liens à cet ID</h3>
                <form method="POST" action="/admin/add-links/${id}" class="add-links">
                    <textarea name="urls" placeholder="Entrez plusieurs URLs, séparées par des virgules" required></textarea>
                    <button type="submit">Ajouter des liens</button>
                </form>
            </div>
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
