package com.ngtec.locationapp.data.local.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import com.ngtec.locationapp.data.local.entity.BienEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface BienDao {
    @Query("SELECT * FROM biens ORDER BY nom ASC")
    fun observeAll(): Flow<List<BienEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(items: List<BienEntity>)

    @Query("DELETE FROM biens WHERE id = :id")
    suspend fun deleteById(id: Long)

    @Query("DELETE FROM biens")
    suspend fun clearAll()
}
