/**
 * TaskModel - Modèle pour la gestion des travaux
 * Gère la conversion statut/pourcentage et les calculs de durée
 */

// Mapping statut -> pourcentage d'avancement
const STATUS_PROGRESS_MAP = {
    'nouveau': 0,
    'en_cours': 50,
    'termine': 100
};

// Mapping inverse pourcentage -> statut
const PROGRESS_STATUS_MAP = {
    0: 'nouveau',
    50: 'en_cours',
    100: 'termine'
};

class TaskModel {
    constructor(data = {}) {
        this.id = data.id || data.id_travaux || null;
        this.titre = data.titre || '';
        this.description = data.description || '';
        this.statut = data.statut || data.statut_code || 'nouveau';
        this.dateDebut = data.date_debut || data.dateDebut || null;
        this.dateFin = data.date_fin || data.dateFin || null;
        this.datePrevueFin = data.date_prevue_fin || data.datePrevueFin || null;
        this.idSignalement = data.id_signalement || data.idSignalement || null;
        this.idEntreprise = data.id_entreprise || data.idEntreprise || null;
        this.idResponsable = data.id_users_responsable || data.idResponsable || null;
        this.entrepriseNom = data.entreprise_nom || data.entrepriseNom || null;
        this.responsableNom = data.responsable_nom || data.responsableNom || null;
        this.createdAt = data.created_at || data.createdAt || null;
        this.updatedAt = data.updated_at || data.updatedAt || null;
    }

    // =====================
    // GETTERS & SETTERS
    // =====================

    getId() { return this.id; }
    setId(id) { this.id = id; }

    getTitre() { return this.titre; }
    setTitre(titre) { this.titre = titre; }

    getDescription() { return this.description; }
    setDescription(description) { this.description = description; }

    getStatut() { return this.statut; }
    setStatut(statut) { this.statut = statut; }

    getDateDebut() { return this.dateDebut; }
    setDateDebut(dateDebut) { this.dateDebut = dateDebut; }

    getDateFin() { return this.dateFin; }
    setDateFin(dateFin) { this.dateFin = dateFin; }

    getDatePrevueFin() { return this.datePrevueFin; }
    setDatePrevueFin(datePrevueFin) { this.datePrevueFin = datePrevueFin; }

    // =====================
    // MÉTHODES DE CALCUL
    // =====================

    /**
     * Convertit le statut en pourcentage d'avancement
     * @returns {number} Pourcentage (0, 50, ou 100)
     */
    getAvancementPourcentage() {
        const statut = this.statut?.toLowerCase() || 'nouveau';
        return STATUS_PROGRESS_MAP[statut] ?? 0;
    }

    /**
     * Définit le statut à partir d'un pourcentage
     * @param {number} pourcentage - Le pourcentage d'avancement
     */
    setAvancementFromPourcentage(pourcentage) {
        if (pourcentage <= 0) {
            this.statut = 'nouveau';
        } else if (pourcentage < 100) {
            this.statut = 'en_cours';
        } else {
            this.statut = 'termine';
        }
    }

    /**
     * Calcule la durée de traitement en jours
     * @returns {number|null} Durée en jours ou null si dates incomplètes
     */
    getDureeJours() {
        if (!this.dateDebut || !this.dateFin) return null;
        
        const debut = new Date(this.dateDebut);
        const fin = new Date(this.dateFin);
        const diffMs = fin.getTime() - debut.getTime();
        
        return Math.round((diffMs / (1000 * 60 * 60 * 24)) * 100) / 100;
    }

    /**
     * Calcule la durée de traitement en heures
     * @returns {number|null} Durée en heures ou null si dates incomplètes
     */
    getDureeHeures() {
        if (!this.dateDebut || !this.dateFin) return null;
        
        const debut = new Date(this.dateDebut);
        const fin = new Date(this.dateFin);
        const diffMs = fin.getTime() - debut.getTime();
        
        return Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;
    }

    /**
     * Vérifie si le travail est en retard par rapport à la date prévue
     * @returns {boolean|null} true si en retard, false sinon, null si pas de date prévue
     */
    isEnRetard() {
        if (!this.datePrevueFin) return null;
        
        const now = new Date();
        const datePrevue = new Date(this.datePrevueFin);
        
        // Si terminé, comparer date_fin avec date_prevue_fin
        if (this.statut === 'termine' && this.dateFin) {
            return new Date(this.dateFin) > datePrevue;
        }
        
        // Si pas terminé et date prévue dépassée
        if (this.statut !== 'termine' && now > datePrevue) {
            return true;
        }
        
        return false;
    }

    /**
     * Calcule l'écart en jours par rapport à la date prévue
     * @returns {number|null} Écart en jours (positif = retard, négatif = avance)
     */
    getEcartJours() {
        if (!this.datePrevueFin) return null;
        
        const datePrevue = new Date(this.datePrevueFin);
        let dateComparaison;
        
        if (this.statut === 'termine' && this.dateFin) {
            dateComparaison = new Date(this.dateFin);
        } else {
            dateComparaison = new Date();
        }
        
        const diffMs = dateComparaison.getTime() - datePrevue.getTime();
        return Math.round((diffMs / (1000 * 60 * 60 * 24)) * 100) / 100;
    }

    /**
     * Convertit le modèle en objet simple pour l'API
     * @returns {Object} Objet avec toutes les propriétés
     */
    toJSON() {
        return {
            id: this.id,
            titre: this.titre,
            description: this.description,
            statut: this.statut,
            avancement_pourcentage: this.getAvancementPourcentage(),
            date_debut: this.dateDebut,
            date_fin: this.dateFin,
            date_prevue_fin: this.datePrevueFin,
            duree_jours: this.getDureeJours(),
            duree_heures: this.getDureeHeures(),
            en_retard: this.isEnRetard(),
            ecart_jours: this.getEcartJours(),
            id_signalement: this.idSignalement,
            id_entreprise: this.idEntreprise,
            id_responsable: this.idResponsable,
            entreprise_nom: this.entrepriseNom,
            responsable_nom: this.responsableNom,
            created_at: this.createdAt,
            updated_at: this.updatedAt
        };
    }

    // =====================
    // MÉTHODES STATIQUES
    // =====================

    /**
     * Convertit un statut en pourcentage
     * @param {string} statut - Le statut du travail
     * @returns {number} Le pourcentage correspondant
     */
    static statutToPourcentage(statut) {
        const s = statut?.toLowerCase() || 'nouveau';
        return STATUS_PROGRESS_MAP[s] ?? 0;
    }

    /**
     * Convertit un pourcentage en statut
     * @param {number} pourcentage - Le pourcentage d'avancement
     * @returns {string} Le statut correspondant
     */
    static pourcentageToStatut(pourcentage) {
        if (pourcentage <= 0) return 'nouveau';
        if (pourcentage < 100) return 'en_cours';
        return 'termine';
    }

    /**
     * Calcule les statistiques pour une liste de travaux
     * @param {TaskModel[]} travaux - Liste des travaux
     * @returns {Object} Statistiques calculées
     */
    static calculerStatistiques(travaux) {
        if (!travaux || travaux.length === 0) {
            return {
                total: 0,
                nouveaux: 0,
                en_cours: 0,
                termines: 0,
                avancement_moyen: 0,
                delai_moyen_jours: null,
                delai_min_jours: null,
                delai_max_jours: null,
                travaux_en_retard: 0
            };
        }

        const stats = {
            total: travaux.length,
            nouveaux: 0,
            en_cours: 0,
            termines: 0,
            avancement_moyen: 0,
            delai_moyen_jours: null,
            delai_min_jours: null,
            delai_max_jours: null,
            travaux_en_retard: 0
        };

        let totalAvancement = 0;
        const durees = [];

        travaux.forEach(travail => {
            // Comptage par statut
            switch (travail.statut?.toLowerCase()) {
                case 'nouveau':
                    stats.nouveaux++;
                    break;
                case 'en_cours':
                    stats.en_cours++;
                    break;
                case 'termine':
                    stats.termines++;
                    break;
            }

            // Avancement
            totalAvancement += travail.getAvancementPourcentage();

            // Durées (seulement pour les travaux terminés avec dates)
            const duree = travail.getDureeJours();
            if (duree !== null && duree >= 0) {
                durees.push(duree);
            }

            // Retards
            if (travail.isEnRetard()) {
                stats.travaux_en_retard++;
            }
        });

        // Calcul des moyennes et min/max
        stats.avancement_moyen = Math.round((totalAvancement / travaux.length) * 100) / 100;

        if (durees.length > 0) {
            stats.delai_moyen_jours = Math.round((durees.reduce((a, b) => a + b, 0) / durees.length) * 100) / 100;
            stats.delai_min_jours = Math.min(...durees);
            stats.delai_max_jours = Math.max(...durees);
        }

        return stats;
    }

    /**
     * Retourne la liste des statuts disponibles
     * @returns {Array} Liste des statuts avec code, label et pourcentage
     */
    static getStatutsDisponibles() {
        return [
            { code: 'nouveau', label: 'Nouveau', pourcentage: 0 },
            { code: 'en_cours', label: 'En cours', pourcentage: 50 },
            { code: 'termine', label: 'Terminé', pourcentage: 100 }
        ];
    }
}

export default TaskModel;
export { STATUS_PROGRESS_MAP, PROGRESS_STATUS_MAP };
