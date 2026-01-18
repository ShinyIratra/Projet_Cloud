// Example model
const exampleModel = {
    data: [],
    add(item) {
        this.data.push(item);
    },
    getAll() {
        return this.data;
    }
};

module.exports = exampleModel;