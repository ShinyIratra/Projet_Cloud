// Example controller
import exampleModel from '../models/exampleModel.js';

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

export default exampleController;