package com.ngtec.locationapp.domain.model

data class Contrat(
    val id: Long,
    val reference: String,
    val locataireNom: String,
    val bienNom: String,
    val montantMensuel: Double,
    val statut: String
)
