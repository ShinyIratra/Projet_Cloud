// Example controller
const exampleModel = require('../models/exampleModel');

const exampleController = {
    addItem(req, res) {
        const item = req.body.item;
        exampleModel.add(item);
        res.send({ message: 'Item added successfully!' });
    },
    getItems(req, res) {
        res.send(exampleModel.getAll());
    }
};

module.exports = exampleController;