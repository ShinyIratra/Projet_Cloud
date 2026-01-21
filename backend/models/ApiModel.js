class ApiModel {
    constructor(status, data, message) {
        this.status = status;
        this.data = data;
        this.message = message;
    }

    // Getters
    getStatus() {
        return this.status;
    }

    getData() {
        return this.data;
    }

    getMessage() {
        return this.message;
    }

    // Setters
    setStatus(status) {
        this.status = status;
    }

    setData(data) {
        this.data = data;
    }

    setMessage(message) {
        this.message = message;
    }
}

export default ApiModel;