package com.ngtec.locationapp.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "contrats")
data class ContratEntity(
    @PrimaryKey val id: Long,
    val reference: String,
    val locataireNom: String,
    val bienNom: String,
    val montantMensuel: Double,
    val statut: String
)
