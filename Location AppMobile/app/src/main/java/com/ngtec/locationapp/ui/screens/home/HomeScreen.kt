package com.ngtec.locationapp.ui.screens.home

import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Dashboard
import androidx.compose.material.icons.filled.Description
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.MoneyOff
import androidx.compose.material.icons.filled.Payments
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.PowerSettingsNew
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.ngtec.locationapp.ui.navigation.AppDestination
import com.ngtec.locationapp.ui.screens.biens.AddBienScreen
import com.ngtec.locationapp.ui.screens.biens.BiensScreen
import com.ngtec.locationapp.ui.screens.clients.AddClientScreen
import com.ngtec.locationapp.ui.screens.clients.ClientsScreen
import com.ngtec.locationapp.ui.screens.contrats.AddContratScreen
import com.ngtec.locationapp.ui.screens.contrats.ContratsScreen
import com.ngtec.locationapp.ui.screens.dashboard.DashboardScreen
import com.ngtec.locationapp.ui.screens.depenses.AddDepenseScreen
import com.ngtec.locationapp.ui.screens.depenses.DepensesScreen
import com.ngtec.locationapp.ui.screens.paiements.AddPaiementScreen
import com.ngtec.locationapp.ui.screens.paiements.PaiementsScreen

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HomeScreen(
    onLogout: () -> Unit
) {
    val navController = rememberNavController()
    val backStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = backStackEntry?.destination?.route ?: AppDestination.Dashboard.route

    val items = listOf(
        HomeNavItem("Dashboard", AppDestination.Dashboard.route, Icons.Default.Dashboard),
        HomeNavItem("Biens", AppDestination.Biens.route, Icons.Default.Home),
        HomeNavItem("Clients", AppDestination.Clients.route, Icons.Default.Person),
        HomeNavItem("Contrats", AppDestination.Contrats.route, Icons.Default.Description),
        HomeNavItem("Paiements", AppDestination.Paiements.route, Icons.Default.Payments),
        HomeNavItem("Depenses", AppDestination.Depenses.route, Icons.Default.MoneyOff)
    )

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Location App") },
                actions = {
                    IconButton(onClick = onLogout) {
                        Icon(
                            imageVector = Icons.Default.PowerSettingsNew,
                            contentDescription = "Se deconnecter"
                        )
                    }
                }
            )
        },
        bottomBar = {
            NavigationBar {
                items.forEach { item ->
                    NavigationBarItem(
                        selected = currentRoute == item.route,
                        onClick = {
                            navController.navigate(item.route) {
                                popUpTo(navController.graph.findStartDestination().id) {
                                    saveState = true
                                }
                                launchSingleTop = true
                                restoreState = true
                            }
                        },
                        icon = {
                            Icon(
                                imageVector = item.icon,
                                contentDescription = item.label
                            )
                        },
                        label = { Text(item.label) }
                    )
                }
            }
        }
    ) { paddingValues ->
        NavHost(
            navController = navController,
            startDestination = AppDestination.Dashboard.route,
            modifier = Modifier.padding(paddingValues)
        ) {
            composable(AppDestination.Dashboard.route) {
                DashboardScreen()
            }

            composable(AppDestination.Biens.route) {
                BiensScreen(
                    onAddBien = {
                        navController.navigate(AppDestination.AddBien.route)
                    }
                )
            }

            composable(AppDestination.Clients.route) {
                ClientsScreen(
                    onAddClient = {
                        navController.navigate(AppDestination.AddClient.route)
                    }
                )
            }

            composable(AppDestination.Contrats.route) {
                ContratsScreen(
                    onAddContrat = {
                        navController.navigate(AppDestination.AddContrat.route)
                    }
                )
            }

            composable(AppDestination.Paiements.route) {
                PaiementsScreen(
                    onAddPaiement = {
                        navController.navigate(AppDestination.AddPaiement.route)
                    }
                )
            }

            composable(AppDestination.Depenses.route) {
                DepensesScreen(
                    onAddDepense = {
                        navController.navigate(AppDestination.AddDepense.route)
                    }
                )
            }

            composable(AppDestination.AddBien.route) {
                AddBienScreen(
                    onSaved = {
                        navController.popBackStack()
                    }
                )
            }

            composable(AppDestination.AddClient.route) {
                AddClientScreen(
                    onSaved = {
                        navController.popBackStack()
                    }
                )
            }

            composable(AppDestination.AddContrat.route) {
                AddContratScreen(
                    onSaved = {
                        navController.popBackStack()
                    }
                )
            }

            composable(AppDestination.AddPaiement.route) {
                AddPaiementScreen(
                    onSaved = {
                        navController.popBackStack()
                    }
                )
            }

            composable(AppDestination.AddDepense.route) {
                AddDepenseScreen(
                    onSaved = {
                        navController.popBackStack()
                    }
                )
            }
        }
    }
}

private data class HomeNavItem(
    val label: String,
    val route: String,
    val icon: androidx.compose.ui.graphics.vector.ImageVector
)
