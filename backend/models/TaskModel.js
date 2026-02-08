/**
 * TaskModel - Modèle pour le suivi d'avancement des signalements
 * S'adapte à la base existante (tables signalements + statut_signalement)
 * Calcul automatique : Nouveau → 0%, En cours → 50%, Terminé → 100%
 */

// Mapping statut -> pourcentage d'avancement
const STATUS_PROGRESS_MAP = {
    'nouveau': 0,
    'en_cours': 50,
    'en cours': 50,
    'termine': 100,
    'terminé': 100
};

class TaskModel {
    /**
     * @param {Object} data - Données issues de la table signalements
     */
    constructor(data = {}) {
        this.id = data.id || data.id_signalements || null;
        this.surface = data.surface || null;
        this.budget = data.budget || null;
        this.statut = data.statut || data.statut_code || 'nouveau';
        this.statutLabel = data.statut_label || this.statut;
        // Dates existantes dans la base
        this.dateSignalement = data.date_signalement || null;   // date de début (création)
        this.dateMiseAJour = data.updated_at || data.date_mise_a_jour || null; // date de mise à jour
        // Infos liées
        this.idEntreprise = data.id_entreprise || null;
        this.entrepriseNom = data.entreprise_nom || null;
        this.idUsers = data.id_users || null;
        this.utilisateurNom = data.utilisateur_nom || null;
        this.idFirebase = data.id_firebase || null;
    }

    // =====================
    // MÉTHODES DE CALCUL
    // =====================

    /**
     * Convertit le statut en pourcentage d'avancement
     * Nouveau → 0%, En cours → 50%, Terminé → 100%
     * @returns {number} Pourcentage (0, 50, ou 100)
     */
    getAvancementPourcentage() {
        const statut = this.statut?.toLowerCase()?.trim() || 'nouveau';
        return STATUS_PROGRESS_MAP[statut] ?? 0;
    }

    /**
     * Retourne la date de début (= date_signalement)
     */
    getDateDebut() {
        return this.dateSignalement;
    }

    /**
     * Retourne la date de mise à jour (= updated_at)
     */
    getDateMiseAJour() {
        return this.dateMiseAJour;
    }

    /**
     * Retourne la date de fin (= updated_at quand statut = terminé)
     */
    getDateFin() {
        const statut = this.statut?.toLowerCase()?.trim();
        if (statut === 'termine' || statut === 'terminé') {
            return this.dateMiseAJour;
        }
        return null;
    }

    /**
     * Calcule la durée de traitement en jours
     * Pour les signalements terminés : updated_at - date_signalement
     * @returns {number|null} Durée en jours ou null
     */
    getDureeJours() {
        if (!this.dateSignalement || !this.getDateFin()) return null;

        const debut = new Date(this.dateSignalement);
        const fin = new Date(this.getDateFin());
        const diffMs = fin.getTime() - debut.getTime();

        return Math.round((diffMs / (1000 * 60 * 60 * 24)) * 100) / 100;
    }

    /**
     * Calcule la durée de traitement en heures
     * @returns {number|null} Durée en heures ou null
     */
    getDureeHeures() {
        if (!this.dateSignalement || !this.getDateFin()) return null;

        const debut = new Date(this.dateSignalement);
        const fin = new Date(this.getDateFin());
        const diffMs = fin.getTime() - debut.getTime();

        return Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;
    }

    /**
     * Convertit le modèle en objet simple pour l'API
     */
    toJSON() {
        return {
            id: this.id,
            surface: this.surface,
            budget: this.budget,
            statut: this.statut,
            statut_label: this.statutLabel,
            avancement_pourcentage: this.getAvancementPourcentage(),
            date_signalement: this.dateSignalement,
            date_mise_a_jour: this.dateMiseAJour,
            date_fin: this.getDateFin(),
            duree_jours: this.getDureeJours(),
            duree_heures: this.getDureeHeures(),
            id_entreprise: this.idEntreprise,
            entreprise_nom: this.entrepriseNom,
            id_users: this.idUsers,
            utilisateur_nom: this.utilisateurNom,
            id_firebase: this.idFirebase
        };
    }

    // =====================
    // MÉTHODES STATIQUES
    // =====================

    /**
     * Convertit un statut en pourcentage
     */
    static statutToPourcentage(statut) {
        const s = statut?.toLowerCase()?.trim() || 'nouveau';
        return STATUS_PROGRESS_MAP[s] ?? 0;
    }

    /**
     * Convertit un pourcentage en statut
     */
    static pourcentageToStatut(pourcentage) {
        if (pourcentage <= 0) return 'nouveau';
        if (pourcentage < 100) return 'en_cours';
        return 'termine';
    }

    /**
     * Retourne la liste des statuts disponibles avec pourcentages
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
export { STATUS_PROGRESS_MAP };
