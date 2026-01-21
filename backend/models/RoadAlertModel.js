class RoadAlertModel 
{
    constructor(id, surface, budget, concerned_entreprise, status, lattitude, longitude, UID, date_alert)
    {
        this.id = id;
        this.surface = surface;
        this.budget = budget;
        this.concerned_entreprise = concerned_entreprise;
        this.status = status;
        this.lattitude = lattitude;
        this.longitude = longitude;
        this.UID = UID;
        this.date_alert = date_alert;
    }

    // Getters and Setters
    getId() {
        return this.id;
    }

    setId(id) {
        this.id = id;
    }

    getSurface() {
        return this.surface;
    }

    setSurface(surface) {
        this.surface = surface;
    }

    getBudget() {
        return this.budget;
    }

    setBudget(budget) {
        this.budget = budget;
    }

    getConcernedEntreprise() {
        return this.concerned_entreprise;
    }

    setConcernedEntreprise(concerned_entreprise) {
        this.concerned_entreprise = concerned_entreprise;
    }

    getStatus() {
        return this.status;
    }

    setStatus(status) {
        this.status = status;
    }

    getLattitude() {
        return this.lattitude;
    }

    setLattitude(lattitude) {
        this.lattitude = lattitude;
    }

    getLongitude() {
        return this.longitude;
    }

    setLongitude(longitude) {
        this.longitude = longitude;
    }

    getUID() {
        return this.UID;
    }

    setUID(UID) {
        this.UID = UID;
    }

    getDateAlert() {
        return this.date_alert;
    }

    setDateAlert(date_alert) {
        this.date_alert = date_alert;
    }
}

export default RoadAlertModel;