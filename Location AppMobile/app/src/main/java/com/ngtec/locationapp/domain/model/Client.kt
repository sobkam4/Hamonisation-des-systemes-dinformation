package com.ngtec.locationapp.domain.model

data class Client(
    val id: Long,
    val nomComplet: String,
    val telephone: String,
    val email: String,
    val adresse: String
)
