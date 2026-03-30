package com.ngtec.locationapp.ui.navigation

sealed class AppDestination(val route: String) {
    data object Splash : AppDestination("splash")
    data object Login : AppDestination("login")
    data object Home : AppDestination("home")
    data object Dashboard : AppDestination("dashboard")
    data object Biens : AppDestination("biens")
    data object Clients : AppDestination("clients")
    data object Contrats : AppDestination("contrats")
    data object Paiements : AppDestination("paiements")
    data object Depenses : AppDestination("depenses")
    data object AddBien : AppDestination("add_bien")
    data object AddClient : AppDestination("add_client")
    data object AddContrat : AppDestination("add_contrat")
    data object AddPaiement : AppDestination("add_paiement")
    data object AddDepense : AppDestination("add_depense")
}
