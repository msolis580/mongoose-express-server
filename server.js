const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

const GroceryItem = require('.models/GroceryItem');
const Employee = require('.models/Employee');
const modelMapping = {
    GroceryInventory: GroceryItem,
    Employee: Employee
};

const connections = {};

const models = {};

const bankUserSchema = new mongoose.Schema({});

const getConnection = async (dbName) => {
    console.log(`getConnection called with ${dbName}`);

    try {
        if (!connections[dbName]) {
            connections[dbName] = await mongoose.createConnection(process.env.MONGO_URI, { dbName: dbName, autoIndex: false });
            console.log(`New database connection created for ${dbName}`);
        } else {
            console.log(`Reusing existing connection for ${dbName}`);
        }
        return connections[dbName];
    } catch (err) {
        console.error(`Error getting connection for ${dbName}:`, err);
        throw err; // Propagate the error to be caught in the calling function
    }
};

const getModel = async (dbName, collectionName) => {
    console.log("getModel called with:", { dbName, collectionName });
    const modelKey = `${dbName}-${collectionName}`;

    if (!models[modelKey]) {
        const connection = await getConnection(dbName);
        const Model = modelMapping[collectionName];

        if (!Model) {
            // Use a dynamic schema if no model is found
            const dynamicSchema = new mongoose.Schema({}, { strict: false, autoIndex: false });
            models[modelKey] = connection.model(
                collectionName,
                dynamicSchema,
                collectionName
            );
            console.log(`Created dynamic model for collection: ${collectionName}`);
        } else {
            models[modelKey] = connection.model(
                Model.modelName,
                Model.schema,
                collectionName  // Use exact collection name from request
            );
            console.log("Created new model for collection:", collectionName);
        }
    }

    return models[modelKey];
};



app.get("/find/:database/:collection", async (req, res) => {
    try {
        const { database, collection } = req.params;
        const Model = await getModel(database, collection);
        const documents = await Model.find({});

        console.log(`query executed, document count is: ${documents.length}`);
        res.status(200).json(documents);

    } catch (err) {
        conosle.log('Error in GET route:', err);
        res.status(500).json({ error: err.message });
    }
});

async function startServer() {
    try {
        app.listen(port, () => {
            console.log(`The server is running on ${port}`);
        })

    } catch (error) {
        console.error('Error starting server:', err);
        process.exit(1);

    }
};

startServer();
