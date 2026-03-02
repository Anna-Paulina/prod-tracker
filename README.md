# prod-tracker
Application de suivi de production
: machines, compétences, employés, présences et charge/disponibilité.

Fonctionnalités

Machines & Compétences : configurez vos machines CNC et les compétences disponibles
Employés : assignez des compétences et machines à chaque employé, marquez les autonomes
Présence : gérez les périodes de présence (dates début/fin) par employé
Pièces & Références : importez un CSV de temps d'usinage ou saisissez manuellement
Tableau de bord : charge machine + disponibilité employés par mois, 2 semaines ou trimestre

Format CSV pour les temps d'usinage
Référence;Machine;Temps_heures
REF-001;Tour CNC-1;2.5
REF-001;Fraiseuse-2;1.75
REF-002;Tour CNC-1;0.5
Installation locale
bashnpm install
npm run dev
