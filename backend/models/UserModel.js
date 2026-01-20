const UserModel = 
{
    UID : String,
    failed_login_attempt: Number,
    status: String,
    type_user: String,

    // Getters
    getUID() {
        return this.UID;
    },

    getFailedLoginAttempt() {
        return this.failed_login_attempt;
    },

    getStatus() {
        return this.status;
    },

    getTypeUser() {
        return this.type_user;
    },

    // Setters
    setUID(uid) {
        this.UID = uid;
    },

    setFailedLoginAttempt(attempt) {
        this.failed_login_attempt = attempt;
    },

    setStatus(status) {
        this.status = status;
    },

    setTypeUser(type) {
        this.type_user = type;
    }
};

export default UserModel;