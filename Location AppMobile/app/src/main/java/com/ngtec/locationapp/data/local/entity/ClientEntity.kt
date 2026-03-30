package com.ngtec.locationapp.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "clients")
data class ClientEntity(
    @PrimaryKey val id: Long,
    val nomComplet: String,
    val telephone: String,
    val email: String,
    val adresse: String
)
