package com.ngtec.locationapp.data.local.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import com.ngtec.locationapp.data.local.entity.PaiementEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface PaiementDao {
    @Query("SELECT * FROM paiements ORDER BY datePaiement DESC")
    fun observeAll(): Flow<List<PaiementEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(items: List<PaiementEntity>)

    @Query("DELETE FROM paiements WHERE id = :id")
    suspend fun deleteById(id: Long)

    @Query("DELETE FROM paiements")
    suspend fun clearAll()
}
