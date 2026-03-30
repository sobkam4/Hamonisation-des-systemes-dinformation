package com.ngtec.locationapp.data.local.db

import androidx.room.Database
import androidx.room.RoomDatabase
import com.ngtec.locationapp.data.local.dao.BienDao
import com.ngtec.locationapp.data.local.dao.ClientDao
import com.ngtec.locationapp.data.local.dao.ContratDao
import com.ngtec.locationapp.data.local.dao.DepenseDao
import com.ngtec.locationapp.data.local.dao.PaiementDao
import com.ngtec.locationapp.data.local.entity.BienEntity
import com.ngtec.locationapp.data.local.entity.ClientEntity
import com.ngtec.locationapp.data.local.entity.ContratEntity
import com.ngtec.locationapp.data.local.entity.DepenseEntity
import com.ngtec.locationapp.data.local.entity.PaiementEntity

@Database(
    entities = [BienEntity::class, ClientEntity::class, ContratEntity::class, PaiementEntity::class, DepenseEntity::class],
    version = 4,
    exportSchema = false
)
abstract class AppDatabase : RoomDatabase() {
    abstract fun bienDao(): BienDao
    abstract fun clientDao(): ClientDao
    abstract fun contratDao(): ContratDao
    abstract fun paiementDao(): PaiementDao
    abstract fun depenseDao(): DepenseDao
}
