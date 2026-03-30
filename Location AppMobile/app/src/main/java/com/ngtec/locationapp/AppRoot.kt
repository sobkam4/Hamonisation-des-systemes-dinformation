package com.ngtec.locationapp

import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import androidx.compose.runtime.Composable
import com.ngtec.locationapp.ui.navigation.AppNavGraph
import com.ngtec.locationapp.ui.theme.LocationAppTheme

@Composable
fun AppRoot() {
    LocationAppTheme {
        Surface(modifier = Modifier.fillMaxSize()) {
            AppNavGraph()
        }
    }
}
