package com.ngtec.locationapp.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "biens")
data class BienEntity(
    @PrimaryKey val id: Long,
    val nom: String,
    val typeBien: String,
    val statut: String,
    val montantMensuel: Double,
    val adresse: String
)
