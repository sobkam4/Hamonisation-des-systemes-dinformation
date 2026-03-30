package com.ngtec.locationapp.data.local.dao

import androidx.room.Dao
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import com.ngtec.locationapp.data.local.entity.DepenseEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface DepenseDao {
    @Query("SELECT * FROM depenses ORDER BY dateDepense DESC")
    fun observeAll(): Flow<List<DepenseEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAll(items: List<DepenseEntity>)

    @Query("DELETE FROM depenses WHERE id = :id")
    suspend fun deleteById(id: Long)

    @Query("DELETE FROM depenses")
    suspend fun clearAll()
}
