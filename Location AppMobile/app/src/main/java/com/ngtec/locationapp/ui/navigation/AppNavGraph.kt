package com.ngtec.locationapp.ui.navigation

import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.hilt.navigation.compose.hiltViewModel
import com.ngtec.locationapp.ui.screens.home.HomeScreen
import com.ngtec.locationapp.ui.screens.login.LoginScreen
import com.ngtec.locationapp.ui.screens.splash.SplashScreen
import com.ngtec.locationapp.ui.session.SessionViewModel

@Composable
fun AppNavGraph(
    modifier: Modifier = Modifier
) {
    val navController = rememberNavController()
    val sessionViewModel: SessionViewModel = hiltViewModel()
    val sessionState by sessionViewModel.uiState.collectAsState()

    LaunchedEffect(sessionState.isLoading, sessionState.isAuthenticated) {
        if (!sessionState.isLoading) {
            val target = if (sessionState.isAuthenticated) {
                AppDestination.Home.route
            } else {
                AppDestination.Login.route
            }

            navController.navigate(target) {
                popUpTo(navController.graph.id) {
                    inclusive = true
                }
                launchSingleTop = true
            }
        }
    }

    NavHost(
        navController = navController,
        startDestination = AppDestination.Splash.route,
        modifier = modifier
    ) {
        composable(AppDestination.Splash.route) {
            SplashScreen()
        }

        composable(AppDestination.Login.route) {
            LoginScreen(
                onLoginSuccess = {
                    navController.navigate(AppDestination.Home.route) {
                        popUpTo(AppDestination.Login.route) {
                            inclusive = true
                        }
                    }
                }
            )
        }

        composable(AppDestination.Home.route) {
            HomeScreen(
                onLogout = {
                    sessionViewModel.logout()
                }
            )
        }
    }
}
