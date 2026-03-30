package com.ngtec.locationapp.data.local.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import com.ngtec.locationapp.data.local.entity.ContratEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface ContratDao {
    @Query("SELECT * FROM contrats ORDER BY reference ASC")
    fun observeAll(): Flow<List<ContratEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(items: List<ContratEntity>)

    @Query("DELETE FROM contrats WHERE id = :id")
    suspend fun deleteById(id: Long)

    @Query("DELETE FROM contrats")
    suspend fun clearAll()
}
